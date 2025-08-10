import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import Terminal from './pages/Terminal'
import Documentation from './pages/Documentation'
import Roadmap from './pages/Roadmap'
import { useStore } from './store/useStore'
import { initializeWebSocket } from './services/websocket'

function App() {
  const { setConnectionStatus } = useStore()

  useEffect(() => {
    const ws = initializeWebSocket()
    
    ws.on('connect', () => {
      setConnectionStatus('connected')
    })

    ws.on('disconnect', () => {
      setConnectionStatus('disconnected')
    })

    return () => {
      ws.disconnect()
    }
  }, [setConnectionStatus])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Terminal />} />
          <Route path="docs" element={<Documentation />} />
          <Route path="roadmap" element={<Roadmap />} />
        </Route>
      </Routes>
    </Router>
  )
}