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
import { safeStorage } from './utils/safeStorage'

function App() {
  const { setConnectionStatus, user, updateUserWallet, updateUserMintedAmount, createFreshUser, setProgress, addLogs, setStats, clearTerminalLogs } = useStore()
  
  // Make clear function available globally for console debugging
  useEffect(() => {
    (window as any).clearKryptLogs = clearTerminalLogs;
    (window as any).nukeCaches = () => {
      clearTerminalLogs();
      safeStorage.clearAll();
      location.reload();
    };
  }, [clearTerminalLogs])
  
  // Initialize early access visitor tracking
  useEarlyAccessTracking()


  // Auto-create wallet for token functionality with persistent device fingerprinting
  useEffect(() => {
    const initializeWallet = async () => {
      const forceNewWallet = safeStorage.get('krypt-force-new-wallet')
      
      if (!user?.walletAddress || forceNewWallet) {
        // Generate persistent device fingerprint
        const generateDeviceFingerprint = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          ctx!.textBaseline = 'top'
          ctx!.font = '14px Arial'
          ctx!.fillText('Device fingerprint', 2, 2)
          
          const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform
          ].join('|')
          
          // Create hash from fingerprint
          let hash = 0
          for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
          }
          return Math.abs(hash).toString(16)
        }

        const deviceFingerprint = generateDeviceFingerprint()
        
        try {
          // Check if this device already has a wallet
          const apiService = ApiService.getInstance()
          const existingWallet = await apiService.getWalletByFingerprint?.(deviceFingerprint)
          
          if (existingWallet && !forceNewWallet) {
            // Restore existing wallet with full state
            updateUserWallet(existingWallet.address, existingWallet.balance)
            if (existingWallet.mintedAmount > 0) {
              updateUserMintedAmount(existingWallet.mintedAmount)
            }
            console.log('🔄 Restored existing wallet for device:', existingWallet.address)
          } else {
            // Generate proper 40-character Ethereum address format
            const generateWalletAddress = () => {
              const chars = '0123456789abcdef'
              let address = '0x'
              for (let i = 0; i < 40; i++) {
                address += chars[Math.floor(Math.random() * chars.length)]
              }
              return address
            }
            const generatedAddress = generateWalletAddress()
            
            if (forceNewWallet) {
              console.log('🔄 Forcing complete wallet reset including staking and minting data')
              createFreshUser(generatedAddress)
            } else {
              updateUserWallet(generatedAddress, 0)
            }
            
            // Register wallet with device fingerprint
            await apiService.registerWalletFingerprint?.(generatedAddress, deviceFingerprint)
          }
          
        } catch (error) {
          console.error('Wallet initialization error:', error)
          // Fallback to local wallet generation
          const generateWalletAddress = () => {
            const chars = '0123456789abcdef'
            let address = '0x'
            for (let i = 0; i < 40; i++) {
              address += chars[Math.floor(Math.random() * chars.length)]
            }
            return address
          }
          const generatedAddress = generateWalletAddress()
          updateUserWallet(generatedAddress, 0)
        }
        
        // Clear the force new wallet flag
        if (forceNewWallet) {
          safeStorage.del('krypt-force-new-wallet')
        }
      }
    }
    
    initializeWallet()
  }, [user, updateUserWallet, createFreshUser])

  // Sync wallet balance to backend
  useEffect(() => {
    const apiService = ApiService.getInstance()
    
    if (user?.walletAddress && user?.balance !== undefined) {
      apiService.updateUserBalance(user.walletAddress, user.balance, user.mintedAmount)
        .catch(console.error)
    }
  }, [user?.walletAddress, user?.balance, user?.mintedAmount])

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
      (stats) => setStats(stats)
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