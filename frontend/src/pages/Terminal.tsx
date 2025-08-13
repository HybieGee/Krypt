import { useState, useRef, useEffect } from 'react'
import TerminalDisplay from '@/components/terminal/TerminalDisplay'
import ChatInterface from '@/components/chat/ChatInterface'
import ProgressBar from '@/components/terminal/ProgressBar'
import { useStore } from '@/store/useStore'

export default function Terminal() {
  const { blockchainProgress, terminalLogs } = useStore()
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>('terminal')
  const [logFilter, setLogFilter] = useState<string>('all')
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true) // Start with true to auto-scroll on page load
  const liveViewRef = useRef<HTMLDivElement>(null)
  const logsViewRef = useRef<HTMLDivElement>(null)
  const [forceRerender, setForceRerender] = useState(0)

  // Filter logs based on selected filter AND timestamp (only show logs whose time has passed)
  const filteredLogs = terminalLogs.filter(log => {
    // Only show logs whose timestamp is in the past or current
    const logTime = new Date(log.timestamp).getTime()
    const currentTime = Date.now()
    const timeHasPassed = logTime <= currentTime
    
    // Apply type filter
    const typeMatches = logFilter === 'all' || log.type === logFilter
    
    return timeHasPassed && typeMatches
  })
  
  // Filter logs for Live View (only show current/past logs)
  const liveViewLogs = terminalLogs.filter(log => {
    const logTime = new Date(log.timestamp).getTime()
    const currentTime = Date.now()
    return logTime <= currentTime
  })

  // Smart auto-scroll: only scroll if user is at bottom
  useEffect(() => {
    if (activeTab === 'terminal' && liveViewRef.current) {
      const terminalElement = liveViewRef.current.querySelector('.terminal-scroll')
      if (terminalElement) {
        const { scrollTop, scrollHeight, clientHeight } = terminalElement
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10
        
        // Only auto-scroll if user is at bottom
        if (isAtBottom) {
          setShouldAutoScroll(true)
          setTimeout(() => setShouldAutoScroll(false), 100)
        }
      }
    }
  }, [liveViewLogs.length, activeTab]) // Trigger when new logs arrive

  // Check if user is scrolled up in logs view (for potential future use)
  const checkLogsScrollPosition = () => {
    // Currently just prevents scroll events from causing issues
    // Could be used for scroll indicators in the future
  }

  // Smart auto-scroll for logs view: only scroll if user is at bottom
  useEffect(() => {
    if (activeTab === 'logs' && logsViewRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsViewRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10 // Tighter threshold
      
      // Auto-scroll if user is at bottom OR if explicitly requested (like tab switch)
      if (isAtBottom || shouldAutoScroll) {
        setTimeout(() => {
          if (logsViewRef.current) {
            logsViewRef.current.scrollTop = logsViewRef.current.scrollHeight
          }
        }, 0)
      }
    }
  }, [activeTab, shouldAutoScroll, filteredLogs.length])

  // Jump to bottom functions
  const jumpToBottomLiveView = () => {
    const terminalElement = liveViewRef.current?.querySelector('.terminal-scroll')
    if (terminalElement) {
      terminalElement.scrollTop = terminalElement.scrollHeight
    }
  }

  const jumpToBottomLogs = () => {
    if (logsViewRef.current) {
      logsViewRef.current.scrollTop = logsViewRef.current.scrollHeight
    }
  }

  // Aggressive layout fix function
  const forceLayoutReset = () => {
    console.log('🔧 Forcing terminal layout reset...')
    
    // Force complete re-render
    setForceRerender(prev => prev + 1)
    
    // Wait for DOM update then fix layout
    setTimeout(() => {
      // Remove any stuck inline styles from all terminal windows
      const terminalElements = document.querySelectorAll('.terminal-window')
      terminalElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement
        if (index === 0) {
          // Main terminal window
          htmlElement.style.minHeight = '500px'
          htmlElement.style.maxHeight = '500px'
          htmlElement.style.height = '500px'
          htmlElement.style.overflow = 'hidden'
        } else {
          // Progress bar window
          htmlElement.style.minHeight = '280px'
          htmlElement.style.maxHeight = '280px'
          htmlElement.style.height = '280px'
          htmlElement.style.overflow = 'auto'
        }
      })
      
      console.log('✅ Terminal layout reset complete')
    }, 50)
  }

  // Handle window resize - fixes developer console open/close bug
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout
    let lastHeight = window.innerHeight

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      
      resizeTimeout = setTimeout(() => {
        const currentHeight = window.innerHeight
        const heightDiff = Math.abs(currentHeight - lastHeight)
        
        // Significant height change suggests dev console toggle
        if (heightDiff > 100) {
          console.log(`🔍 Detected significant height change: ${lastHeight} → ${currentHeight}`)
          forceLayoutReset()
        }
        
        lastHeight = currentHeight
        
        // Reset scroll positions
        setTimeout(() => {
          if (activeTab === 'terminal') {
            jumpToBottomLiveView()
          } else {
            jumpToBottomLogs()
          }
        }, 200)
        
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [activeTab])

  // Add manual reset button function
  const handleManualReset = () => {
    console.log('🔄 Manual terminal reset triggered')
    forceLayoutReset()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20" style={{ minHeight: '700px' }}>
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="terminal-window flex-1 flex flex-col" style={{ 
          minHeight: '500px',
          maxHeight: '500px', // Completely fixed height
          height: '500px',
          overflow: 'hidden'
        }}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-terminal-green/30">
            <h2 className="text-lg font-bold text-terminal-green">
              Krypt Development Terminal
            </h2>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setActiveTab('terminal')
                    setShouldAutoScroll(true)
                    setTimeout(() => setShouldAutoScroll(false), 200)
                  }}
                  className={`px-3 py-1 text-sm transition-colors ${
                    activeTab === 'terminal'
                      ? 'text-terminal-green border-b border-terminal-green'
                      : 'text-terminal-green/60 hover:text-terminal-green'
                  }`}
                >
                  Live View
                </button>
                <button
                  onClick={() => {
                    setActiveTab('logs')
                    setShouldAutoScroll(true)
                    setTimeout(() => setShouldAutoScroll(false), 200)
                  }}
                  className={`px-3 py-1 text-sm transition-colors ${
                    activeTab === 'logs'
                      ? 'text-terminal-green border-b border-terminal-green'
                      : 'text-terminal-green/60 hover:text-terminal-green'
                  }`}
                >
                  Development Logs ({terminalLogs.length})
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={activeTab === 'terminal' ? jumpToBottomLiveView : jumpToBottomLogs}
                  className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/30 text-terminal-green hover:bg-terminal-green/20 transition-colors rounded"
                  title="Jump to bottom"
                >
                  ↓ Bottom
                </button>
                <button
                  onClick={handleManualReset}
                  className="px-2 py-1 text-xs bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors rounded"
                  title="Fix terminal layout if corrupted (for dev console bug)"
                >
                  🔧 Fix
                </button>
                <a
                  href="https://github.com/KryptAI/krypt-blockchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs bg-terminal-green/20 border border-terminal-green/50 text-terminal-green hover:bg-terminal-green/30 transition-colors rounded flex items-center space-x-1 font-medium"
                  title="View Krypt AI blockchain code repository"
                >
                  <span>📁</span>
                  <span>Code</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden" ref={liveViewRef} key={`terminal-container-${forceRerender}`}>
            {activeTab === 'terminal' ? (
              <TerminalDisplay 
                key={`terminal-display-${forceRerender}`}
                logs={liveViewLogs.slice(-50)} 
                shouldScrollToBottom={shouldAutoScroll}
              />
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

                <div className="h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar" ref={logsViewRef} onScroll={checkLogsScrollPosition} key={`logs-view-${forceRerender}`}>
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

        <div className="terminal-window" style={{ 
          minHeight: '280px',
          maxHeight: '280px',
          height: '280px',
          overflow: 'auto'
        }}>
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