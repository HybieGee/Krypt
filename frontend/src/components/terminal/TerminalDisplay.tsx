import { useEffect, useRef } from 'react'

interface TerminalLog {
  id: string
  timestamp: Date
  type: 'code' | 'commit' | 'phase' | 'system'
  message: string
  details?: any
}

interface Props {
  logs: TerminalLog[]
}

export default function TerminalDisplay({ logs }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div 
      ref={terminalRef}
      className="h-full overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed"
    >
      <div className="space-y-1">
        <div className="text-terminal-green">
          <span className="text-terminal-green/60">$</span> krypt --init blockchain
        </div>
        <div className="text-terminal-green/80">
          Initializing Krypt Blockchain Development Environment...
        </div>
        <div className="text-terminal-green/80">
          Loading 640 components across 4 phases...
        </div>
        <div className="text-terminal-green/80 mb-4">
          Starting autonomous development process...
        </div>

        {logs.map((log) => (
          <div key={log.id} className="flex flex-col space-y-1">
            <div className="flex items-start">
              <span className="text-terminal-green/60 mr-2">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className={`flex-1 ${
                log.type === 'commit' ? 'text-yellow-400' :
                log.type === 'phase' ? 'text-blue-400' :
                log.type === 'system' ? 'text-red-400' :
                'text-terminal-green'
              }`}>
                {log.message}
              </span>
            </div>
            
            {log.details?.code && (
              <div className="ml-20 p-2 bg-terminal-gray/50 border-l-2 border-terminal-green/30">
                <pre className="text-terminal-green/70 text-[10px]">
                  {log.details.code}
                </pre>
              </div>
            )}
          </div>
        ))}

        <div className="text-terminal-green animate-pulse">
          <span className="inline-block animate-blink">_</span>
        </div>
      </div>
    </div>
  )
}