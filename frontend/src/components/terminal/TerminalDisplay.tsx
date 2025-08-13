import { useEffect, useRef, useState } from 'react'

interface TerminalLog {
  id: string
  timestamp: Date | string
  type: 'code' | 'commit' | 'phase' | 'system' | 'api' | 'warning' | 'test' | 'github'
  message: string
  details?: any
}

interface Props {
  logs: TerminalLog[]
  shouldScrollToBottom?: boolean // New prop to trigger auto-scroll
}

export default function TerminalDisplay({ logs, shouldScrollToBottom = false }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [currentTyping, setCurrentTyping] = useState('')

  // Check if user is scrolled up from bottom (for potential future use)
  const checkScrollPosition = () => {
    // Currently just prevents scroll events from causing issues
    // Could be used for scroll indicators in the future
  }

  // Auto-scroll to bottom only if user is already at bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10 // Tighter threshold
      
      // Always auto-scroll if user is at bottom when new content arrives
      if (isAtBottom || shouldScrollToBottom) {
        // Use setTimeout to ensure DOM has updated with new content
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
          }
        }, 0)
      }
    }
  }, [logs.length, shouldScrollToBottom])

  // Smooth typing animation system
  useEffect(() => {
    let currentText = ''
    let targetText = ''
    let isTyping = false
    let typeIndex = 0

    const codeSnippets = [
      'export class BlockStructure {',
      'private merkleRoot: string;',
      'async validateTransaction(tx: Transaction) {',
      'import { CryptoUtils } from "./crypto";',
      'public readonly hash: string = this.calculateHash();',
      'constructor(data: BlockData, previousHash: string) {',
      'if (!this.isValidSignature()) {',
      'throw new ValidationError("Invalid transaction");',
      'return await this.signTransaction(privateKey);',
      'interface ConsensusRules {',
      'private async computeProofOfStake() {',
      'const stakingPool = new Map<string, number>();',
      '// Implement Byzantine fault tolerance',
      'export default class NetworkNode implements P2PNode {',
      'public verify(): Promise<boolean> {',
      'async connectToPeer(address: string): Promise<void> {',
      'this.transactionPool.add(transaction);',
      'return crypto.createHash("sha256").update(data);',
      'await this.broadcastToNetwork(block);',
      'const nonce = this.findValidNonce(difficulty);'
    ]

    const typeCharacter = () => {
      if (typeIndex < targetText.length) {
        currentText = targetText.substring(0, typeIndex + 1)
        setCurrentTyping(currentText + '█')
        typeIndex++
        setTimeout(typeCharacter, 50 + Math.random() * 100) // 50-150ms per character
      } else {
        // Finished typing, show cursor for a moment then clear
        setCurrentTyping(currentText + '█')
        setTimeout(() => {
          targetText = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
          currentText = ''
          typeIndex = 0
          isTyping = false
          setCurrentTyping('')
        }, 1000 + Math.random() * 2000) // 1-3 second pause
      }
    }

    const startNewText = () => {
      if (!isTyping) {
        isTyping = true
        targetText = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
        typeIndex = 0
        typeCharacter()
      }
    }

    // Start immediately
    startNewText()

    // Check for new text every 100ms
    const interval = setInterval(() => {
      if (!isTyping) {
        startNewText()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      ref={terminalRef}
      className="h-96 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed custom-scrollbar terminal-scroll"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#00ff41 #1a1a1a'
      }}
      onScroll={checkScrollPosition}
    >
      <div className="space-y-1">
        <div className="text-terminal-green">
          <span className="text-terminal-green/60">$</span> krypt --init blockchain
        </div>
        <div className="text-terminal-green/80">
          Initializing Krypt Blockchain Development Environment...
        </div>
        <div className="text-terminal-green/80">
          Loading blockchain infrastructure across 4 phases...
        </div>
        <div className="text-terminal-green/80 mb-4">
          Starting autonomous development process...
        </div>

        {logs.length > 0 ? logs.map((log) => (
          <div key={log.id} className="flex flex-col space-y-1">
            <div className="flex items-start">
              <span className="text-terminal-green/60 mr-2">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className={`flex-1 ${
                log.type === 'commit' ? 'text-red-400' :
                log.type === 'phase' ? 'text-blue-400' :
                log.type === 'system' ? 'text-red-400' :
                log.type === 'api' ? 'text-cyan-400' :
                log.type === 'warning' ? 'text-orange-400' :
                'text-terminal-green'
              }`}>
                {log.message}
              </span>
            </div>
            
            {(log.details?.snippet || log.details?.code) && (
              <div className="ml-6 mt-2 p-3 bg-black/60 border border-terminal-green/20 rounded">
                <div className="text-terminal-green/40 text-[9px] mb-1 font-semibold">
                  📄 Code Generated:
                </div>
                <pre className="text-terminal-green/80 text-[10px] leading-tight overflow-x-auto">
                  {log.details.snippet || 
                   (log.details.code ? 
                     (log.details.code.split('\n').slice(0, 8).join('\n') + 
                      (log.details.code.split('\n').length > 8 ? '\n... [view full code in Development Logs]' : ''))
                     : '')}
                </pre>
              </div>
            )}
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <div className="text-terminal-green/40 text-lg">⏸️</div>
            <div className="text-terminal-green/60 text-sm">Terminal Paused</div>
            <div className="text-terminal-green/40 text-xs text-center">
              Development will resume when API is available
            </div>
          </div>
        )}

        {/* AI typing simulation */}
        {logs.length > 0 && !logs.some(log => log.type === 'warning' && log.message.includes('halted')) && (
          <div className="mt-4 space-y-1">
            <div className="text-terminal-green/60">
              <span className="text-terminal-green/60">$</span> krypt --develop --ai-mode
            </div>
            <div className="text-terminal-green flex items-center">
              <span className="text-terminal-green/60 mr-2">&gt;</span>
              <span className="font-mono text-sm">
                {currentTyping || <span className="animate-pulse">█</span>}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}