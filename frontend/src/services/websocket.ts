import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initializeWebSocket = (): Socket => {
  if (!socket) {
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (import.meta.env.PROD ? 'https://krypt-terminal.vercel.app' : 'http://localhost:3001')
    
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  return socket
}

export const getSocket = (): Socket | null => socket

export const disconnectWebSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}