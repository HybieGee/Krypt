import { useStore } from '@/store/useStore'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { statistics, user } = useStore()
  const [time, setTime] = useState(new Date())
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="border-b border-terminal-green bg-black/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-terminal-green">KRYPT TERMINAL</h1>
              <span className="text-terminal-green/60 text-sm">
                v1.3.3
              </span>
            </div>
            
            {/* Navigation buttons moved into header */}
            <div className="flex space-x-0 border border-terminal-green/30 rounded">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 rounded-l ${
                  location.pathname === '/' 
                    ? 'text-terminal-bg bg-terminal-green' 
                    : 'text-terminal-green hover:bg-terminal-green/10'
                }`}
              >
                Terminal
              </Link>
              <Link
                to="/tokens"
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 ${
                  location.pathname === '/tokens' 
                    ? 'text-terminal-bg bg-terminal-green' 
                    : 'text-terminal-green hover:bg-terminal-green/10'
                }`}
              >
                Tokens
              </Link>
              <Link
                to="/roadmap"
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 ${
                  location.pathname === '/roadmap' 
                    ? 'text-terminal-bg bg-terminal-green' 
                    : 'text-terminal-green hover:bg-terminal-green/10'
                }`}
              >
                Roadmap
              </Link>
              <Link
                to="/docs"
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-r ${
                  location.pathname === '/docs' 
                    ? 'text-terminal-bg bg-terminal-green' 
                    : 'text-terminal-green hover:bg-terminal-green/10'
                }`}
              >
                Docs
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-terminal-green/60">Users:</span>
              <span className="text-terminal-green font-bold">
                {statistics.totalUsers.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-terminal-green/60">Early Access:</span>
              <span className="text-terminal-green font-bold">
                {statistics.earlyAccessUsers.toLocaleString()}
              </span>
            </div>

            {user?.isMining && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                <span className="text-terminal-green text-xs">Mining</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
              <span className="text-terminal-green">
                {time.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}