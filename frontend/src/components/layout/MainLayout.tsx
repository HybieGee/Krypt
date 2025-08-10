import { Outlet, Link, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import Header from './Header'
import Footer from './Footer'

export default function MainLayout() {
  const location = useLocation()
  const { connectionStatus } = useStore()

  return (
    <div className="min-h-screen flex flex-col bg-terminal-bg">
      <Header />
      
      <nav className="bg-terminal-gray border-b border-terminal-green sticky top-[88px] z-40 -mt-px">
        <div className="container mx-auto px-4">
          <div className="flex space-x-0">
            <Link
              to="/"
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 ${
                location.pathname === '/' 
                  ? 'text-terminal-bg bg-terminal-green' 
                  : 'text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green'
              }`}
            >
              Terminal
            </Link>
            <Link
              to="/wallet"
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 ${
                location.pathname === '/wallet' 
                  ? 'text-terminal-bg bg-terminal-green' 
                  : 'text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green'
              }`}
            >
              Wallet
            </Link>
            <Link
              to="/tokens"
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 ${
                location.pathname === '/tokens' 
                  ? 'text-terminal-bg bg-terminal-green' 
                  : 'text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green'
              }`}
            >
              Tokens
            </Link>
            <Link
              to="/roadmap"
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-r border-terminal-green/30 ${
                location.pathname === '/roadmap' 
                  ? 'text-terminal-bg bg-terminal-green' 
                  : 'text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green'
              }`}
            >
              Roadmap
            </Link>
            <Link
              to="/docs"
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                location.pathname === '/docs' 
                  ? 'text-terminal-bg bg-terminal-green' 
                  : 'text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green'
              }`}
            >
              Documentation
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative">
        <div className="container mx-auto px-4 py-8">
          {connectionStatus === 'disconnected' && (
            <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400 rounded-lg terminal-window">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono">Connection lost. Attempting to reconnect...</span>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}