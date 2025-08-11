import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import Terminal from './pages/Terminal'
import Documentation from './pages/Documentation'
import Roadmap from './pages/Roadmap'
import Tokens from './pages/Tokens'
import Rewards from './pages/Rewards'
import { useStore } from './store/useStore'
import ApiService from './services/api'

function App() {
  const { setConnectionStatus, user, updateUserWallet, setProgress, addLogs, setStats } = useStore()

  // Track unique visitors
  useEffect(() => {
    const apiService = ApiService.getInstance()
    
    // Check if this is a new unique visitor
    const visitorId = localStorage.getItem('krypt_visitor_id')
    const firstVisit = localStorage.getItem('krypt_first_visit')
    
    console.log('Visitor tracking check:', { 
      visitorId, 
      firstVisit,
      isNew: !visitorId,
      localStorageLength: localStorage.length,
      allStorageKeys: Object.keys(localStorage),
      isIncognito: 'test if incognito'
    })
    
    // Test if we're actually in incognito/private mode
    try {
      localStorage.setItem('incognito_test', 'test')
      localStorage.removeItem('incognito_test')
      console.log('localStorage is working (not incognito or storage allowed)')
    } catch (e) {
      console.log('localStorage blocked (likely incognito)')
    }
    
    // Always register every visitor for now to debug the issue
    const newVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    if (!visitorId) {
      localStorage.setItem('krypt_visitor_id', newVisitorId)
      localStorage.setItem('krypt_first_visit', new Date().toISOString())
    }
    
    console.log('Registering visitor (debugging):', newVisitorId)
    
    // Register as early access user (temporarily always register for debugging)
    apiService.registerEarlyAccessUser(newVisitorId)
      .then(response => {
        console.log('Registration response:', response)
        console.log('Early Access Users count:', response.totalEarlyAccessUsers)
        console.log('Debug info:', response.debug)
      })
      .catch(error => {
        console.error('Registration error:', error)
      })
  }, [])

  useEffect(() => {
    const apiService = ApiService.getInstance()
    
    // Set connected immediately since we're using HTTP polling
    setConnectionStatus('connected')
    
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
          <Route path="tokens" element={<Tokens />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="docs" element={<Documentation />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App