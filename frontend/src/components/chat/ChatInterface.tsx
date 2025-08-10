import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import axios from 'axios'

export default function ChatInterface() {
  const { chatMessages, addChatMessage, user } = useStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: input,
      timestamp: new Date(),
    }

    addChatMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        userId: user?.id || 'anonymous',
      })

      const aiMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        message: response.data.data.message,
        timestamp: new Date(),
      }

      addChatMessage(aiMessage)
    } catch (error) {
      console.error('Chat error:', error)
      addChatMessage({
        id: Date.now().toString() + '_error',
        type: 'system',
        message: 'Failed to get response. Please try again.',
        timestamp: new Date(),
      })
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
          AI Assistant
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {chatMessages.length === 0 ? (
          <div className="text-terminal-green/40 text-sm">
            <p>Welcome to Krypt Chat!</p>
            <p className="mt-2">Ask me about:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>Memecoin trading strategies</li>
              <li>Wallet analysis and research</li>
              <li>Project information</li>
              <li>Blockchain development progress</li>
            </ul>
          </div>
        ) : (
          chatMessages.map((msg: any) => (
            <div key={msg.id} className={`flex ${
              msg.type === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`max-w-[80%] p-2 rounded ${
                msg.type === 'user' 
                  ? 'bg-terminal-green/20 border border-terminal-green/50' 
                  : msg.type === 'system'
                  ? 'bg-red-500/20 border border-red-500/50'
                  : 'bg-terminal-gray border border-terminal-green/30'
              }`}>
                <div className="text-xs text-terminal-green/60 mb-1">
                  {msg.type === 'user' ? 'You' : msg.type === 'system' ? 'System' : 'Krypt'}
                </div>
                <div className="text-sm text-terminal-green">
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-terminal-gray border border-terminal-green/30 p-2 rounded">
              <div className="text-terminal-green animate-pulse">
                Krypt is thinking...
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
          placeholder="Ask Krypt anything..."
          className="flex-1 terminal-input text-sm"
          disabled={isLoading}
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