import { Router } from 'express'
import { query } from '../lib/database'
import { logger } from '../lib/logger'

const router = Router()

// Get blockchain progress
router.get('/progress', async (req, res) => {
  try {
    const stats = await query('SELECT * FROM global_stats')
    const statsMap: Record<string, any> = {}
    stats.rows.forEach(row => {
      statsMap[row.stat_name] = row.stat_value
    })
    
    res.json({
      currentPhase: parseInt(statsMap.current_phase || 1),
      componentsCompleted: parseInt(statsMap.components_completed || 0),
      totalComponents: 640,
      percentComplete: (parseInt(statsMap.components_completed || 0) / 640) * 100,
      linesOfCode: parseInt(statsMap.total_lines_of_code || 0),
      commits: parseInt(statsMap.total_commits || 0),
      testsRun: parseInt(statsMap.total_tests_run || 0)
    })
  } catch (error) {
    logger.error('Failed to get progress:', error)
    res.status(500).json({ error: 'Failed to get progress' })
  }
})

// Get development logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const logs = await query(
      'SELECT * FROM development_logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    )
    
    res.json(logs.rows)
  } catch (error) {
    logger.error('Failed to get logs:', error)
    res.status(500).json({ error: 'Failed to get logs' })
  }
})

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await query('SELECT * FROM global_stats')
    const result: Record<string, any> = {}
    stats.rows.forEach(row => {
      result[row.stat_name] = {
        value: parseInt(row.stat_value),
        lastUpdated: row.last_updated
      }
    })
    
    res.json(result)
  } catch (error) {
    logger.error('Failed to get stats:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Track user session
router.post('/session', async (req, res) => {
  try {
    const { sessionId, walletAddress } = req.body
    
    // Create or update user
    const result = await query(
      `INSERT INTO users (session_id, wallet_address, first_seen, last_active)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id) 
       DO UPDATE SET last_active = CURRENT_TIMESTAMP, wallet_address = COALESCE($2, users.wallet_address)
       RETURNING *`,
      [sessionId, walletAddress]
    )
    
    // Update early access counter
    await query(
      `UPDATE global_stats 
       SET stat_value = (SELECT COUNT(*) FROM users WHERE is_early_access = true)
       WHERE stat_name = 'early_access_users'`
    )
    
    res.json({ user: result.rows[0] })
  } catch (error) {
    logger.error('Failed to track session:', error)
    res.status(500).json({ error: 'Failed to track session' })
  }
})

export default router