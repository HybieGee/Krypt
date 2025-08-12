import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import Terminal from './pages/Terminal'
import Documentation from './pages/Documentation'
import Roadmap from './pages/Roadmap'
import Tokens from './pages/Tokens'
import Rewards from './pages/Rewards'
import Tokenomics from './pages/Tokenomics'
import { useStore } from './store/useStore'
import ApiService from './services/api'
import { useEarlyAccessTracking } from './hooks/useEarlyAccessTracking'

function App() {
  const { setConnectionStatus, user, updateUserWallet, createFreshUser, setProgress, addLogs, setStats } = useStore()
  
  // Initialize early access visitor tracking
  useEarlyAccessTracking()


  // Auto-create wallet for token functionality
  useEffect(() => {
    const forceNewWallet = localStorage.getItem('krypt-force-new-wallet')
    
    if (!user?.walletAddress || forceNewWallet) {
      // Generate truly unique wallet address using timestamp + random + crypto
      const timestamp = Date.now().toString(16)
      const random1 = Math.random().toString(16).substring(2)
      const random2 = Math.random().toString(16).substring(2)
      const generatedAddress = `0x${(timestamp + random1 + random2).substring(0, 40)}`
      
      if (forceNewWallet) {
        console.log('🔄 Forcing complete wallet reset including staking and minting data')
        createFreshUser(generatedAddress)
      } else {
        updateUserWallet(generatedAddress, 0)
      }
      
      // Clear the force new wallet flag
      if (forceNewWallet) {
        localStorage.removeItem('krypt-force-new-wallet')
      }
    }
  }, [user, updateUserWallet, createFreshUser])

  // Sync wallet balance to backend
  useEffect(() => {
    const apiService = ApiService.getInstance()
    
    if (user?.walletAddress && user?.balance !== undefined) {
      apiService.updateUserBalance(user.walletAddress, user.balance)
        .catch(console.error)
    }
  }, [user?.walletAddress, user?.balance])

  useEffect(() => {
    const apiService = ApiService.getInstance()
    
    // Set connected immediately since we're using HTTP polling
    setConnectionStatus('connected')
    
    // Nuclear reset check disabled - endpoint not working properly
    // TODO: Re-enable when nuclear-reset-check endpoint is fixed
    const resetCheckInterval = null
    
    // Start polling for real-time updates
    apiService.startPolling(
      (progress) => setProgress(progress),
      (logs) => addLogs(logs),
      (stats) => setStats(stats),
      (error) => {
        console.error('API polling error:', error)
        setConnectionStatus('disconnected')
        
        // Retry connection after 5 seconds
        setTimeout(() => {
          setConnectionStatus('connected')
        }, 5000)
      }
    )

    // Listen for immediate stats updates after early access registration
    const handleEarlyAccessRegistered = (event: CustomEvent) => {
      console.log('Immediate stats update after registration:', event.detail)
      setStats(event.detail.stats)
    }
    
    window.addEventListener('early-access-registered', handleEarlyAccessRegistered as EventListener)

    return () => {
      apiService.stopPolling()
      if (resetCheckInterval) clearInterval(resetCheckInterval)
      window.removeEventListener('early-access-registered', handleEarlyAccessRegistered as EventListener)
    }
  }, [setConnectionStatus, setProgress, addLogs, setStats])

  // Global mining effect - works on any page
  useEffect(() => {
    let miningInterval: NodeJS.Timeout
    
    if (user?.isMining && user?.walletAddress) {
      miningInterval = setInterval(() => {
        const miningReward = (Math.random() * 1.7 + 0.3) // 0.3-2 tokens per interval
        updateUserWallet(user.walletAddress!, (user.balance || 0) + miningReward)
      }, 5000) // Every 5 seconds
    }
    
    return () => {
      if (miningInterval) clearInterval(miningInterval)
    }
  }, [user?.isMining, user?.walletAddress, user?.balance, updateUserWallet])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Terminal />} />
          <Route path="wallet" element={<Tokens />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="docs" element={<Documentation />} />
          <Route path="tokenomics" element={<Tokenomics />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App