interface ChatMessage {
  id: string
  message: string
  username: string
  walletAddress?: string
  timestamp: string
}

interface ChatServiceOptions {
  onMessage: (messages: ChatMessage[]) => void
  onError?: (error: string) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

class ChatService {
  private ws: WebSocket | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private options: ChatServiceOptions
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private baseUrl: string
  private currentMessages: ChatMessage[] = []

  constructor(options: ChatServiceOptions) {
    this.options = options
    this.baseUrl = import.meta.env.VITE_API_URL || window.location.origin
    // Convert HTTP/HTTPS to WS/WSS for WebSocket connection
    this.baseUrl = this.baseUrl.replace(/^https?:\/\//, 'wss://')
    if (this.baseUrl.startsWith('http://')) {
      this.baseUrl = this.baseUrl.replace('http://', 'ws://')
    }
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    
    try {
      // Connect to the WebSocket endpoint
      const wsUrl = `${this.baseUrl}/api/chat/ws`
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.options.onConnected?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📩 WebSocket message received:', data.type, data)
          
          // Handle initial chat history
          if (data.type === 'history' && data.messages) {
            this.currentMessages = data.messages || []
            this.options.onMessage(this.currentMessages)
          }
          // Handle new messages broadcast
          else if (data.type === 'new_message' && data.message) {
            console.log('🆕 New message broadcast:', data.message)
            // Add the new message to current messages
            this.currentMessages.push(data.message)
            // Keep only last 100 messages
            if (this.currentMessages.length > 100) {
              this.currentMessages = this.currentMessages.slice(-100)
            }
            // Notify parent with updated message list
            this.options.onMessage([...this.currentMessages])
          }
          // Handle bulk messages (fallback format)
          else if (data.type === 'messages' && data.messages) {
            this.currentMessages = data.messages || []
            this.options.onMessage(this.currentMessages)
          }
          // Handle errors
          else if (data.type === 'error') {
            console.error('Chat error from server:', data.message)
            this.options.onError?.(data.message)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        this.isConnecting = false
        this.ws = null
        this.options.onDisconnected?.()
        
        // Attempt to reconnect if not closed intentionally
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.isConnecting = false
        this.options.onError?.('WebSocket connection error')
        
        // Fallback to polling if WebSocket fails
        this.fallbackToPolling()
      }

    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.isConnecting = false
      this.fallbackToPolling()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Exponential backoff, max 30s
    
    console.log(`🔄 Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private async fallbackToPolling() {
    console.log('📡 Falling back to polling for chat messages')
    
    // Use traditional HTTP polling as fallback
    const poll = async () => {
      try {
        const apiUrl = this.baseUrl.replace(/^wss?:\/\//, 'https://')
        const response = await fetch(`${apiUrl}/api/chat/messages?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.messages) {
            this.options.onMessage(result.messages)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Initial poll
    poll()
    
    // Poll every 2 seconds as fallback
    setInterval(poll, 2000)
  }


  async sendMessage(message: string, username: string, walletAddress?: string): Promise<{ success: boolean; message?: string }> {
    // Try WebSocket first if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageData = {
          type: 'message',
          message: message.trim(),
          username,
          walletAddress
        }
        
        console.log('📤 Sending via WebSocket:', messageData)
        this.ws.send(JSON.stringify(messageData))
        
        return { success: true, message: 'Message sent via WebSocket' }
      } catch (error) {
        console.error('WebSocket send failed:', error)
        // Fall through to HTTP as backup
      }
    }
    
    // Fallback to HTTP if WebSocket is not available
    try {
      const apiUrl = this.baseUrl.replace(/^wss?:\/\//, 'https://')
      const response = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, username, walletAddress })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, message: result.error || 'Failed to send message' }
      }
      return result
    } catch (error) {
      console.error('Failed to send message:', error)
      return { success: false, message: 'Network error' }
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }

    this.reconnectAttempts = 0
    this.isConnecting = false
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export default ChatService
export type { ChatMessage }