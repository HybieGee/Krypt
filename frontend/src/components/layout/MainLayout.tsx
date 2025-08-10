import { Outlet } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import Header from './Header'
import Footer from './Footer'

export default function MainLayout() {
  const { connectionStatus } = useStore()

  return (
    <div className="min-h-screen flex flex-col bg-terminal-bg">
      <Header />

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