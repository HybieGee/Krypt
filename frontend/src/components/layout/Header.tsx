import { useStore } from '@/store/useStore'
import { useState, useEffect } from 'react'

export default function Header() {
  const { statistics, user } = useStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="border-b border-terminal-green bg-black/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-terminal-green">KRYPT TERMINAL</h1>
            <span className="text-terminal-green/60 text-sm">
              v1.0.0
            </span>
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