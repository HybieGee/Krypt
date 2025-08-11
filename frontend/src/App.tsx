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

  // Simple visitor tracking - register unique visitor ID
  useEffect(() => {
    console.log('APP MOUNTED - checking visitor ID')
    
    let visitorId = localStorage.getItem('krypt_visitor_id')
    console.log('Current visitor ID:', visitorId)
    
    if (!visitorId) {
      // Generate unique visitor ID (UUID-like)
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem('krypt_visitor_id', visitorId)
      
      console.log('NEW VISITOR - Generated ID:', visitorId)
      console.log('About to register visitor...')
      
      // Register visitor
      fetch('/api/register-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      })
        .then(response => {
          console.log('Registration response status:', response.status)
          return response.json()
        })
        .then(data => {
          console.log('VISITOR REGISTERED - Total count:', data.totalVisitors)
          // Immediately update the stats to show the new count
          setStats({
            total_users: { value: data.totalVisitors, lastUpdated: new Date().toISOString() },
            early_access_users: { value: data.totalVisitors, lastUpdated: new Date().toISOString() },
            total_lines_of_code: { value: 0, lastUpdated: new Date().toISOString() },
            total_commits: { value: 0, lastUpdated: new Date().toISOString() },
            total_tests_run: { value: 0, lastUpdated: new Date().toISOString() },
            components_completed: { value: 0, lastUpdated: new Date().toISOString() },
            current_phase: { value: 1, lastUpdated: new Date().toISOString() }
          })
        })
        .catch(error => {
          console.error('REGISTRATION FAILED:', error)
        })
    } else {
      console.log('RETURNING VISITOR - ID exists:', visitorId)
      // Even for returning visitors, let's call the API to see what count it returns
      fetch('/api/register-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      })
        .then(response => response.json())
        .then(data => {
          console.log('RETURNING VISITOR API RESPONSE:', data.totalVisitors)
          // Update stats even for returning visitors
          setStats({
            total_users: { value: data.totalVisitors, lastUpdated: new Date().toISOString() },
            early_access_users: { value: data.totalVisitors, lastUpdated: new Date().toISOString() },
            total_lines_of_code: { value: 0, lastUpdated: new Date().toISOString() },
            total_commits: { value: 0, lastUpdated: new Date().toISOString() },
            total_tests_run: { value: 0, lastUpdated: new Date().toISOString() },
            components_completed: { value: 0, lastUpdated: new Date().toISOString() },
            current_phase: { value: 1, lastUpdated: new Date().toISOString() }
          })
        })
        .catch(console.error)
    }
  }, [])

  // Auto-create wallet for token functionality
  useEffect(() => {
    if (!user?.walletAddress) {
      const generatedAddress = `0x${Math.random().toString(16).substring(2, 42)}`
      updateUserWallet(generatedAddress, 0)
    }
  }, [user, updateUserWallet])

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