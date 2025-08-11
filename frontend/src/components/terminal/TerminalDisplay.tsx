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
}

export default function TerminalDisplay({ logs }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [currentTyping, setCurrentTyping] = useState('')
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  // Auto-scroll only if user isn't manually scrolling
  useEffect(() => {
    if (terminalRef.current && !isUserScrolling) {
      const container = terminalRef.current
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50
      
      if (isAtBottom) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [logs, isUserScrolling])

  // Handle scroll events to detect user interaction
  const handleScroll = () => {
    if (terminalRef.current) {
      const container = terminalRef.current
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50
      
      setIsUserScrolling(!isAtBottom)
      
      // Reset to auto-scroll if user scrolls to bottom
      if (isAtBottom && isUserScrolling) {
        setIsUserScrolling(false)
      }
    }
  }

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
        // Finished typing, pause then start new text
        setTimeout(() => {
          targetText = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
          currentText = ''
          typeIndex = 0
          isTyping = false
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
      onScroll={handleScroll}
      className="h-96 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed custom-scrollbar"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#00ff41 #1a1a1a'
      }}
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
                log.type === 'api' ? 'text-cyan-400' :
                log.type === 'warning' ? 'text-orange-400' :
                'text-terminal-green'
              }`}>
                {log.message}
              </span>
            </div>
            
            {log.details?.code && (
              <div className="ml-20 p-2 bg-terminal-gray/50 border-l-2 border-terminal-green/30">
                <pre className="text-terminal-green/70 text-[10px]">
                  {log.details.code.split('\n').slice(0, 3).join('\n')}
                  {log.details.code.split('\n').length > 3 && '\n... [truncated]'}
                </pre>
              </div>
            )}
          </div>
        ))}

        {/* AI typing simulation */}
        <div className="mt-4 space-y-1">
          <div className="text-terminal-green/60">
            <span className="text-terminal-green/60">$</span> krypt --develop --ai-mode
          </div>
          <div className="text-terminal-green/80">
            🤖 Krypt is coding...
          </div>
          <div className="text-terminal-green flex items-center">
            <span className="text-terminal-green/60 mr-2">&gt;</span>
            <span className="font-mono text-sm">
              {currentTyping}
              <span className="animate-pulse">█</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}