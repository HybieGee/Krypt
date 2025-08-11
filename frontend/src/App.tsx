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
    console.log('Visitor tracking check:', { visitorId, isNew: !visitorId })
    
    if (!visitorId) {
      // Generate unique visitor ID
      const newVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('krypt_visitor_id', newVisitorId)
      localStorage.setItem('krypt_first_visit', new Date().toISOString())
      
      console.log('Registering new visitor:', newVisitorId)
      
      // Register as new early access user
      apiService.registerEarlyAccessUser(newVisitorId)
        .then(response => {
          console.log('Registration response:', response)
        })
        .catch(error => {
          console.error('Registration error:', error)
        })
    } else {
      console.log('Returning visitor, not registering')
    }
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

    return () => {
      apiService.stopPolling()
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