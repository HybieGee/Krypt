import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import ApiService from '@/services/api'

export default function ChatInterface() {
  const { user } = useStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const apiService = ApiService.getInstance()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chat messages on mount and poll for updates
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const chatMessages = await apiService.getChatMessages()
        setMessages(chatMessages)
      } catch (error) {
        console.error('Failed to load chat messages:', error)
      }
    }

    loadMessages()
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  const getUserDisplayName = () => {
    if (user?.walletAddress) {
      return `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    }
    return 'Anonymous'
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)

    try {
      const result = await apiService.sendChatMessage(
        input,
        getUserDisplayName(),
        user?.walletAddress
      )

      if (result.success) {
        setInput('')
        // Message will appear in next poll cycle
      } else {
        console.error('Failed to send message:', result.message)
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="terminal-window h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-terminal-green/30">
        <h2 className="text-lg font-bold text-terminal-green">
          Krypt Chat
        </h2>
        <span className="text-xs text-terminal-green/60">
          Global Chat ({messages.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-terminal-green/40 text-sm">
            <p>Welcome to Krypt Global Chat!</p>
            <p className="mt-2">Chat with other Krypt users:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>Discuss memecoin strategies</li>
              <li>Share wallet insights</li>
              <li>Ask questions about the project</li>
              <li>Connect with the community</li>
            </ul>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isCurrentUser = msg.walletAddress === user?.walletAddress
            return (
              <div key={msg.id} className={`flex ${
                isCurrentUser ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-[80%] p-2 rounded ${
                  isCurrentUser 
                    ? 'bg-terminal-green/20 border border-terminal-green/50' 
                    : 'bg-terminal-gray border border-terminal-green/30'
                }`}>
                  <div className="text-xs text-terminal-green/60 mb-1 flex items-center justify-between">
                    <span>{isCurrentUser ? 'You' : msg.username}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="text-sm text-terminal-green">
                    {msg.message}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-terminal-green/10 border border-terminal-green/30 p-2 rounded">
              <div className="text-terminal-green/60 text-sm">
                Sending...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Chat as ${getUserDisplayName()}...`}
          className="flex-1 terminal-input text-sm"
          disabled={isLoading}
          maxLength={500}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="terminal-button text-sm"
        >
          Send
        </button>
      </div>
    </div>
  )
}