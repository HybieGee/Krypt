import type { VercelRequest, VercelResponse } from '@vercel/node'

// Simple mock data for now to get the connection working
const mockProgress = {
  currentPhase: 1,
  componentsCompleted: 45,
  totalComponents: 640,
  percentComplete: 7.03,
  linesOfCode: 2847,
  commits: 12,
  testsRun: 45
}

const mockLogs = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    type: 'code',
    message: '✓ Developed BlockStructure_1 (67 lines)',
    details: { phase: 1, component: 'BlockStructure_1' }
  },
  {
    id: '2', 
    timestamp: new Date(Date.now() - 30000).toISOString(),
    type: 'commit',
    message: '📦 Committed to krypt-blockchain repo: 45/640 components',
    details: { commits: 12 }
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'test',
    message: '✅ Tests passed: 10/10 (Total: 45)',
    details: { testsRun: 45 }
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'code',
    message: '✓ Developed TransactionPool_3 (52 lines)',
    details: { phase: 1, component: 'TransactionPool_3' }
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    type: 'github',
    message: '🔄 Pushed to blockchain repository: HybieGee/krypt-blockchain',
    details: { repo: 'krypt-blockchain' }
  }
]

const mockStats = {
  total_users: { value: 1247, lastUpdated: new Date().toISOString() },
  early_access_users: { value: 892, lastUpdated: new Date().toISOString() },
  total_lines_of_code: { value: 2847, lastUpdated: new Date().toISOString() },
  total_commits: { value: 12, lastUpdated: new Date().toISOString() },
  total_tests_run: { value: 45, lastUpdated: new Date().toISOString() },
  components_completed: { value: 45, lastUpdated: new Date().toISOString() },
  current_phase: { value: 1, lastUpdated: new Date().toISOString() }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { url, method } = req
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Health check
  if (url === '/api/health') {
    return res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production'
    })
  }

  // Progress endpoint
  if (url === '/api/progress') {
    // Simulate some progress over time
    const progress = { ...mockProgress }
    progress.componentsCompleted = Math.min(640, progress.componentsCompleted + Math.floor(Math.random() * 2))
    progress.percentComplete = (progress.componentsCompleted / 640) * 100
    progress.linesOfCode += Math.floor(Math.random() * 50)
    
    return res.json(progress)
  }

  // Logs endpoint
  if (url?.startsWith('/api/logs')) {
    // Add a new log entry occasionally
    if (Math.random() > 0.7) {
      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: ['code', 'commit', 'test'][Math.floor(Math.random() * 3)],
        message: [
          '✓ Developed CryptoEngine_5 (73 lines)',
          '📦 Committed progress: Phase 1 development',
          '✅ Tests passed: 8/8 new components'
        ][Math.floor(Math.random() * 3)],
        details: {}
      }
      mockLogs.unshift(newLog as any)
      if (mockLogs.length > 20) mockLogs.pop()
    }
    
    return res.json(mockLogs)
  }

  // Stats endpoint
  if (url === '/api/stats') {
    // Update stats slightly
    const stats = { ...mockStats }
    stats.early_access_users.value += Math.floor(Math.random() * 3)
    stats.total_lines_of_code.value += Math.floor(Math.random() * 25)
    
    return res.json(stats)
  }

  // Session tracking endpoint
  if (url === '/api/session' && method === 'POST') {
    const { sessionId, walletAddress } = req.body || {}
    
    return res.json({
      user: {
        id: sessionId || 'temp-user',
        walletAddress,
        isEarlyAccess: true,
        joinedAt: new Date().toISOString()
      }
    })
  }

  // Default 404
  return res.status(404).json({ error: 'Not found' })
}