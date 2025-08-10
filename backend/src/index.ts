import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'
import apiRoutes from './routes/api'
import { initializeDatabase } from './config/database'
import { initializeRedis } from './config/redis'
import { BlockchainSimulator } from './services/blockchainSimulator'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000',
    credentials: true,
  },
})

const PORT = process.env.PORT || 5000

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
})

app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', limiter)

app.use('/api', apiRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

let blockchainSimulator: BlockchainSimulator

io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`)

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`)
  })

  socket.on('chat:message', async (_data) => {
    socket.emit('chat:response', { 
      id: Date.now().toString(),
      message: 'Response from Krypt',
      timestamp: new Date(),
    })
  })

  socket.on('user:connect', (userId) => {
    socket.join(`user:${userId}`)
    socket.emit('user:connected', { userId })
  })
})

const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await initializeDatabase()
      await initializeRedis()
    }

    blockchainSimulator = new BlockchainSimulator(io)
    blockchainSimulator.start()

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
      logger.info(`Mock AI: ${process.env.USE_MOCK_AI === 'true' ? 'Enabled' : 'Disabled'}`)
      logger.info(`Mock Blockchain: ${process.env.USE_MOCK_BLOCKCHAIN === 'true' ? 'Enabled' : 'Disabled'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export { app, io }