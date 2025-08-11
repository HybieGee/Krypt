import { useState, useEffect, useRef } from 'react'
import TerminalDisplay from '@/components/terminal/TerminalDisplay'
import ChatInterface from '@/components/chat/ChatInterface'
import ProgressBar from '@/components/terminal/ProgressBar'
import { useStore } from '@/store/useStore'

export default function Terminal() {
  const { blockchainProgress, terminalLogs } = useStore()
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>('terminal')
  const [logFilter, setLogFilter] = useState<string>('all')
  const liveViewRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of Live View when returning to Terminal page
  useEffect(() => {
    if (activeTab === 'terminal' && liveViewRef.current) {
      // Small delay to ensure the component is rendered
      setTimeout(() => {
        // Just scroll the terminal display to bottom (don't scroll page)
        if (liveViewRef.current) {
          const terminalElement = liveViewRef.current.querySelector('.h-96')
          if (terminalElement) {
            terminalElement.scrollTop = terminalElement.scrollHeight
          }
        }
      }, 100)
    }
  }, [activeTab])

  // Also scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (activeTab === 'terminal' && liveViewRef.current && terminalLogs.length > 0) {
      setTimeout(() => {
        if (liveViewRef.current) {
          const terminalElement = liveViewRef.current.querySelector('.h-96')
          if (terminalElement) {
            // Only auto-scroll if user is near the bottom
            const isNearBottom = terminalElement.scrollTop >= terminalElement.scrollHeight - terminalElement.clientHeight - 50
            if (isNearBottom) {
              terminalElement.scrollTop = terminalElement.scrollHeight
            }
          }
        }
      }, 50)
    }
  }, [terminalLogs, activeTab])

  // Filter logs based on selected filter
  const filteredLogs = terminalLogs.filter(log => {
    if (logFilter === 'all') return true
    return log.type === logFilter
  })

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

          <div className="flex-1 overflow-hidden" ref={liveViewRef}>
            {activeTab === 'terminal' ? (
              <TerminalDisplay logs={terminalLogs.slice(-20)} />
            ) : (
              <>
                {/* Log Filter */}
                <div className="mb-3 pb-2 border-b border-terminal-green/20">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-terminal-green/60">Filter:</span>
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-black border border-terminal-green/30 text-terminal-green text-xs px-2 py-1 rounded focus:outline-none focus:border-terminal-green"
                    >
                      <option value="all">All Logs</option>
                      <option value="code">Code Generation</option>
                      <option value="commit">Commits</option>
                      <option value="api">API Requests</option>
                      <option value="system">System</option>
                      <option value="test">Tests</option>
                      <option value="phase">Phase Changes</option>
                      <option value="warning">Warnings</option>
                    </select>
                    <span className="text-xs text-terminal-green/40">
                      ({filteredLogs.length} logs)
                    </span>
                  </div>
                </div>

                <div className="h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {filteredLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-terminal-green/20 pl-3">
                    {/* Log Header */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-terminal-green/60">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className={`font-semibold ${
                          log.type === 'commit' ? 'text-yellow-400' :
                          log.type === 'phase' ? 'text-blue-400' :
                          log.type === 'system' ? 'text-red-400' :
                          log.type === 'api' ? 'text-cyan-400' :
                          log.type === 'warning' ? 'text-orange-400' :
                          'text-terminal-green'
                        }`}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Log Message */}
                    <div className={`text-xs mb-2 ${
                      log.type === 'commit' ? 'text-yellow-400' :
                      log.type === 'phase' ? 'text-blue-400' :
                      log.type === 'system' ? 'text-red-400' :
                      log.type === 'api' ? 'text-cyan-400' :
                      log.type === 'warning' ? 'text-orange-400' :
                      'text-terminal-green'
                    }`}>
                      {log.message}
                    </div>

                    {/* Code Section - Only for code logs */}
                    {log.details?.code && (
                      <div className="mt-2">
                        <div className="text-[10px] text-terminal-green/60 mb-1 font-semibold">
                          Generated Code ({log.details.code.split('\n').length} lines):
                        </div>
                        <div className="bg-black/50 border border-terminal-green/30 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                          <pre className="text-[10px] text-terminal-green/80 font-mono leading-tight whitespace-pre-wrap">
                            {log.details.code}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    {log.details && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-terminal-green/50">
                        {log.details.phase && (
                          <div>Phase: {log.details.phase}/4</div>
                        )}
                        {log.details.responseTime && (
                          <div>Response: {log.details.responseTime}</div>
                        )}
                        {log.details.tokensUsed && (
                          <div>Tokens: {log.details.tokensUsed}</div>
                        )}
                        {log.details.model && (
                          <div>Model: {log.details.model}</div>
                        )}
                        {log.details.commits && (
                          <div>Total Commits: {log.details.commits}</div>
                        )}
                        {log.details.testsRun && (
                          <div>Tests Run: {log.details.testsRun}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </>
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