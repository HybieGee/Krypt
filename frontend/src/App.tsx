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
import { useAirdropNotifications } from './hooks/useAirdropNotifications'
import { safeStorage } from './utils/safeStorage'
import MilestoneNotification from './components/ui/MilestoneNotification'

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
    // Emergency wallet collision reset
    (window as any).resetKryptWallet = () => {
      console.warn('🔄 Forcing complete wallet reset...')
      safeStorage.del('krypt-device-fingerprint')
      safeStorage.set('krypt-force-new-wallet', 'true')
      location.reload()
    };
    // Create completely fresh user
    (window as any).createFreshUser = () => {
      console.warn('🆕 Creating completely fresh user...')
      safeStorage.clearAll()
      safeStorage.set('krypt-force-new-wallet', 'true')
      location.reload()
    };
  }, [clearTerminalLogs])
  
  // Initialize early access visitor tracking
  useEarlyAccessTracking()
  
  // Initialize airdrop notifications
  const { pendingAirdrops, dismissAirdrop } = useAirdropNotifications()


  // Auto-create wallet for token functionality with persistent device fingerprinting
  useEffect(() => {
    const initializeWallet = async () => {
      const forceNewWallet = safeStorage.get('krypt-force-new-wallet')
      
      if (!user?.walletAddress || forceNewWallet) {
        // Generate persistent device fingerprint with high uniqueness
        const generateDeviceFingerprint = () => {
          // Check for existing unique ID first
          let storedFingerprint = safeStorage.get('krypt-device-fingerprint')
          if (storedFingerprint && !forceNewWallet) {
            return storedFingerprint
          }
          
          // Generate enhanced fingerprint with more unique characteristics
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.textBaseline = 'top'
            ctx.font = '14px Arial'
            ctx.fillText('Krypt fingerprint test', 2, 2)
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
            ctx.fillRect(0, 0, 100, 50)
          }
          
          // Get WebGL fingerprint
          let webglFingerprint = ''
          try {
            const gl = document.createElement('canvas').getContext('webgl')
            if (gl) {
              const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
              webglFingerprint = gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER) || ''
            }
          } catch (e) {
            webglFingerprint = 'webgl-error'
          }
          
          // Get audio context fingerprint
          let audioFingerprint = ''
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            audioFingerprint = oscillator.toString()
            audioContext.close()
          } catch (e) {
            audioFingerprint = 'audio-error'
          }
          
          const timestamp = Date.now()
          const random1 = Math.random().toString(36)
          const random2 = Math.random().toString(36)
          
          const fingerprint = [
            navigator.userAgent || '',
            navigator.language || '',
            navigator.languages?.join(',') || '',
            screen.width + 'x' + screen.height,
            screen.colorDepth || '',
            new Date().getTimezoneOffset(),
            canvas.toDataURL(),
            webglFingerprint,
            audioFingerprint,
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform || '',
            navigator.cookieEnabled ? 'cookies' : 'no-cookies',
            navigator.doNotTrack || 'no-dnt',
            window.devicePixelRatio || 1,
            navigator.maxTouchPoints || 0,
            timestamp, // Ensures uniqueness even with identical devices
            random1,   // Additional randomness
            random2,   // More randomness
            window.screen.availHeight || '',
            window.screen.availWidth || '',
            (navigator as any).connection?.effectiveType || 'unknown',
            document.documentElement.clientWidth || '',
            document.documentElement.clientHeight || ''
          ].join('|')
          
          // Create secure hash from fingerprint using multiple hash rounds
          let hash = 0
          for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
          }
          
          // Additional hash round for better distribution
          let hash2 = hash
          const hashStr = hash.toString()
          for (let i = 0; i < hashStr.length; i++) {
            const char = hashStr.charCodeAt(i)
            hash2 = ((hash2 << 7) - hash2) + char
            hash2 = hash2 & hash2
          }
          
          const finalFingerprint = Math.abs(hash2).toString(16) + Math.abs(hash).toString(16)
          
          // Store for persistence
          safeStorage.set('krypt-device-fingerprint', finalFingerprint)
          console.log('🔒 Generated unique device fingerprint:', finalFingerprint.substring(0, 8) + '...')
          
          return finalFingerprint
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
            // Generate proper 40-character Ethereum address format with collision detection
            const generateWalletAddress = () => {
              const chars = '0123456789abcdef'
              let address = '0x'
              
              // Use crypto.getRandomValues for stronger randomness if available
              if (window.crypto && window.crypto.getRandomValues) {
                const randomBytes = new Uint8Array(20)
                window.crypto.getRandomValues(randomBytes)
                for (let i = 0; i < 20; i++) {
                  address += chars[randomBytes[i] >> 4] + chars[randomBytes[i] & 15]
                }
              } else {
                // Fallback to Math.random with timestamp mixing
                const timestamp = Date.now().toString(16)
                for (let i = 0; i < 40; i++) {
                  const randomValue = Math.floor(Math.random() * chars.length)
                  const timestampInfluence = parseInt(timestamp[i % timestamp.length] || '0', 16)
                  const finalIndex = (randomValue + timestampInfluence) % chars.length
                  address += chars[finalIndex]
                }
              }
              
              // Add additional uniqueness by mixing in device fingerprint
              const fingerprintInfluence = deviceFingerprint.substring(0, 8)
              for (let i = 0; i < 8; i++) {
                const pos = 2 + (i * 5) // Positions 2, 7, 12, 17, 22, 27, 32, 37
                if (pos < address.length) {
                  const originalChar = address[pos]
                  const fingerprintChar = fingerprintInfluence[i]
                  const combined = (parseInt(originalChar, 16) + parseInt(fingerprintChar, 16)) % 16
                  address = address.substring(0, pos) + chars[combined] + address.substring(pos + 1)
                }
              }
              
              return address
            }
            const generatedAddress = generateWalletAddress()
            
            console.log('🆕 Generated new wallet address:', generatedAddress, 'for fingerprint:', deviceFingerprint.substring(0, 8) + '...')
            
            if (forceNewWallet) {
              console.log('🔄 Forcing complete wallet reset including staking and minting data')
              createFreshUser(generatedAddress)
            } else {
              updateUserWallet(generatedAddress, 0)
            }
            
            // Register wallet with device fingerprint
            try {
              await apiService.registerWalletFingerprint?.(generatedAddress, deviceFingerprint)
            } catch (error: any) {
              console.error('Wallet registration error:', error)
              // If there's a collision, clear the stored fingerprint and generate a new one
              if (error.message?.includes('collision') || error.message?.includes('CRITICAL')) {
                console.warn('🚨 Wallet collision detected, clearing fingerprint and retrying...')
                safeStorage.del('krypt-device-fingerprint')
                // Force page reload to generate completely new fingerprint and wallet
                window.location.reload()
                return
              }
            }
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
    <>
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
      
      {/* Airdrop Notifications - Using portal-style positioning */}
      {pendingAirdrops.length > 0 && (
        <div 
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ 
            zIndex: 2147483647, // Maximum safe z-index value
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="space-y-4">
            {pendingAirdrops.map((airdrop, index) => (
              <MilestoneNotification
                key={airdrop.airdropId}
                airdrop={airdrop}
                onDismiss={dismissAirdrop}
                delay={index * 200} // Stagger animations
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default App