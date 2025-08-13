import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import ChatService, { ChatMessage } from '@/services/chatService'

export default function ChatInterface() {
  const { user } = useStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatServiceRef = useRef<ChatService | null>(null)

  const scrollToBottom = () => {
    // Scroll only within the chat container, not the entire page
    if (messagesEndRef.current && messagesEndRef.current.parentElement) {
      const chatContainer = messagesEndRef.current.parentElement
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize WebSocket chat service
  useEffect(() => {
    console.log('🚀 Initializing real-time chat service')
    
    chatServiceRef.current = new ChatService({
      onMessage: (newMessages) => {
        console.log('📨 Real-time messages received:', { 
          messageCount: newMessages.length, 
          timestamp: new Date().toLocaleTimeString(),
          lastMessage: newMessages[newMessages.length - 1]?.message || 'No messages'
        })
        setMessages(newMessages)
      },
      onConnected: () => {
        console.log('✅ Real-time chat connected')
        setConnectionStatus('connected')
      },
      onDisconnected: () => {
        console.log('🔌 Real-time chat disconnected')
        setConnectionStatus('disconnected')
      },
      onError: (error) => {
        console.error('❌ Chat error:', error)
        setConnectionStatus('disconnected')
      }
    })

    // Connect to WebSocket
    chatServiceRef.current.connect()

    // Cleanup on unmount
    return () => {
      if (chatServiceRef.current) {
        chatServiceRef.current.disconnect()
      }
    }
  }, [])

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'disconnected': return 'text-red-400'
      default: return 'text-terminal-green/60'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live'
      case 'connecting': return 'Connecting...'
      case 'disconnected': return 'Offline'
      default: return 'Unknown'
    }
  }

  const getUserDisplayName = () => {
    if (user?.walletAddress) {
      return `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    }
    return 'Anonymous'
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatServiceRef.current) return

    setIsLoading(true)

    try {
      const result = await chatServiceRef.current.sendMessage(
        input,
        getUserDisplayName(),
        user?.walletAddress
      )

      if (result.success) {
        console.log('✅ Message sent successfully via real-time chat')
        setInput('')
        // WebSocket will automatically receive the updated messages
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
    <div className="terminal-window h-full flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-terminal-green/30">
        <h2 className="text-lg font-bold text-terminal-green">
          Krypt Chat
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${getConnectionStatusColor()}`}>
            ● {getConnectionStatusText()}
          </span>
          <span className="text-xs text-terminal-green/60">
            ({messages.length})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar min-h-0">
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
          messages.map((msg: ChatMessage) => {
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={`Chat as ${getUserDisplayName()}...`}
          className="flex-1 text-sm bg-black border border-terminal-green/30 text-terminal-green rounded px-3 py-2 focus:outline-none focus:border-terminal-green placeholder-terminal-green/40 resize-none overflow-y-auto custom-scrollbar h-10"
          disabled={isLoading}
          maxLength={500}
          rows={1}
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