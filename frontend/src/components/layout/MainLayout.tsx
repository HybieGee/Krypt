import { Outlet, Link, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import Header from './Header'
import Footer from './Footer'

export default function MainLayout() {
  const location = useLocation()
  const { connectionStatus } = useStore()

  return (
    <div className="min-h-screen flex flex-col bg-terminal-bg">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="scanline h-full w-full" />
      </div>
      
      <Header />
      
      <nav className="border-b border-terminal-green/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`py-3 px-4 border-b-2 transition-colors ${
                location.pathname === '/'
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-transparent text-terminal-green/60 hover:text-terminal-green'
              }`}
            >
              Terminal
            </Link>
            <Link
              to="/roadmap"
              className={`py-3 px-4 border-b-2 transition-colors ${
                location.pathname === '/roadmap'
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-transparent text-terminal-green/60 hover:text-terminal-green'
              }`}
            >
              Roadmap
            </Link>
            <Link
              to="/docs"
              className={`py-3 px-4 border-b-2 transition-colors ${
                location.pathname === '/docs'
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-transparent text-terminal-green/60 hover:text-terminal-green'
              }`}
            >
              Documentation
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-6">
          {connectionStatus === 'disconnected' && (
            <div className="mb-4 p-3 border border-red-500 bg-red-500/10 text-red-400 rounded">
              Connection lost. Attempting to reconnect...
            </div>
          )}
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}