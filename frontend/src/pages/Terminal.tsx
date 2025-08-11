import { useState, useEffect } from 'react'
import TerminalDisplay from '@/components/terminal/TerminalDisplay'
import ChatInterface from '@/components/chat/ChatInterface'
import ProgressBar from '@/components/terminal/ProgressBar'
import { useStore } from '@/store/useStore'
import { getSocket } from '@/services/websocket'

export default function Terminal() {
  const { blockchainProgress, terminalLogs, addTerminalLog, updateBlockchainProgress } = useStore()
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>('terminal')

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on('terminal:log', (log) => {
      addTerminalLog(log)
    })

    socket.on('blockchain:progress', (progress) => {
      updateBlockchainProgress(progress)
    })

    return () => {
      socket.off('terminal:log')
      socket.off('blockchain:progress')
    }
  }, [addTerminalLog, updateBlockchainProgress])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)] pb-20">
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="terminal-window flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-terminal-green/30">
            <h2 className="text-lg font-bold text-terminal-green">
              Krypt Development Terminal
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1 text-sm transition-colors ${
                  activeTab === 'terminal'
                    ? 'text-terminal-green border-b border-terminal-green'
                    : 'text-terminal-green/60 hover:text-terminal-green'
                }`}
              >
                Live View
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1 text-sm transition-colors ${
                  activeTab === 'logs'
                    ? 'text-terminal-green border-b border-terminal-green'
                    : 'text-terminal-green/60 hover:text-terminal-green'
                }`}
              >
                Development Logs ({terminalLogs.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'terminal' ? (
              <TerminalDisplay logs={terminalLogs.slice(-20)} />
            ) : (
              <div className="h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {terminalLogs.map((log) => (
                  <div key={log.id} className="text-xs">
                    <span className="text-terminal-green/60">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`ml-2 ${
                      log.type === 'commit' ? 'text-yellow-400' :
                      log.type === 'phase' ? 'text-blue-400' :
                      log.type === 'system' ? 'text-red-400' :
                      'text-terminal-green'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="terminal-window">
          <h3 className="text-sm font-bold text-terminal-green mb-3">
            Blockchain Development Progress
          </h3>
          <ProgressBar progress={blockchainProgress} />
          
          <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <span className="text-terminal-green/60">Current Phase:</span>
              <span className="ml-2 text-terminal-green">
                Phase {blockchainProgress.currentPhase}/4
              </span>
            </div>
            <div>
              <span className="text-terminal-green/60">Phase Progress:</span>
              <span className="ml-2 text-terminal-green">
                {blockchainProgress.phaseProgress.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <ChatInterface />
      </div>
    </div>
  )
}