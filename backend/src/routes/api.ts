import { Router } from 'express'
import { logger } from '../utils/logger'

const router = Router()

router.get('/stats', async (_req, res) => {
  try {
    const stats = {
      totalUsers: Math.floor(Math.random() * 1000) + 100,
      earlyAccessUsers: Math.floor(Math.random() * 100) + 10,
      linesOfCode: Math.floor(Math.random() * 100000) + 10000,
      githubCommits: Math.floor(Math.random() * 1000) + 100,
      testsRun: Math.floor(Math.random() * 5000) + 500,
    }
    res.json({ success: true, data: stats })
  } catch (error) {
    logger.error('Error fetching stats:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' })
  }
})

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    
    if (process.env.USE_MOCK_AI === 'true') {
      const mockResponse = {
        id: Date.now().toString(),
        message: `Mock response to: ${message}`,
        timestamp: new Date(),
      }
      res.json({ success: true, data: mockResponse })
    } else {
      res.json({ success: true, data: { message: 'AI integration pending' } })
    }
  } catch (error) {
    logger.error('Error in chat:', error)
    res.status(500).json({ success: false, error: 'Chat service error' })
  }
})

router.get('/blockchain/progress', async (_req, res) => {
  try {
    const progress = {
      currentPhase: 1,
      phaseProgress: 25,
      totalComponents: 1000,
      completedComponents: 40,
      percentComplete: 6.25,
      estimatedCompletion: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
    }
    res.json({ success: true, data: progress })
  } catch (error) {
    logger.error('Error fetching blockchain progress:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch progress' })
  }
})

export default router