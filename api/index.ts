import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { initializeDatabase } from './lib/database'
import { BlockchainDeveloper } from './lib/blockchainDeveloper'
import apiRoutes from './routes'
import { logger } from './lib/logger'

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)

// Configure CORS for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://krypt-terminal.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware
app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// API routes
app.use('/api', apiRoutes)

// Socket.io configuration
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})

// Initialize blockchain developer
let blockchainDeveloper: BlockchainDeveloper | null = null

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  // Send current progress on connection
  socket.emit('connection:success', {
    message: 'Connected to Krypt Terminal',
    timestamp: new Date()
  })
  
  // Handle chat messages
  socket.on('chat:message', async (data) => {
    try {
      // Chat logic will be implemented
      socket.emit('chat:response', {
        message: 'Chat system coming soon',
        timestamp: new Date()
      })
    } catch (error) {
      logger.error('Chat error:', error)
      socket.emit('chat:error', { error: 'Failed to process message' })
    }
  })
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Initialize services
async function initialize() {
  try {
    // Initialize database
    await initializeDatabase()
    
    // Start blockchain developer if API key is configured
    if (process.env.ANTHROPIC_API_KEY) {
      blockchainDeveloper = new BlockchainDeveloper(io)
      await blockchainDeveloper.start()
      logger.info('Blockchain developer started')
    } else {
      logger.warn('No Anthropic API key configured - blockchain development disabled')
    }
    
  } catch (error) {
    logger.error('Initialization failed:', error)
  }
}

// Start server
const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
    initialize()
  })
}

// Export for Vercel
export default app

// Export handler for Vercel serverless
export const handler = app

// Initialize on module load for Vercel
if (process.env.VERCEL) {
  initialize()
}