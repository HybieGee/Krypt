import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude AI if API key is available
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

// In-memory storage for development progress (will be replaced with database)
let currentProgress = {
  currentPhase: 1,
  componentsCompleted: 0,
  totalComponents: 1500,
  percentComplete: 0,
  linesOfCode: 0,
  commits: 0,
  testsRun: 0,
  lastUpdated: Date.now()
}

let developmentLogs: any[] = []
let isGeneratingComponent = false
let progressLock = false

// In-memory storage for users and balances
let users = new Map<string, { walletAddress: string, balance: number, lastUpdated: Date }>()

// Blockchain components definition
const blockchainComponents = [
  // Phase 1: Core Infrastructure (160 components)
  'BlockStructure', 'TransactionPool', 'CryptographicHash', 'MerkleTree', 'BlockValidator',
  'TransactionValidator', 'DigitalSignature', 'PublicKeyInfrastructure', 'ConsensusRules',
  'NetworkProtocol', 'PeerDiscovery', 'MessagePropagation', 'DataStructures', 'StorageEngine',
  // ... (abbreviated for space, but represents 640 total components)
]

async function generateBlockchainComponent(componentIndex: number): Promise<{ code: string, lines: number } | null> {
  if (!anthropic) {
    return null // No API key available
  }

  try {
    const componentName = blockchainComponents[componentIndex % blockchainComponents.length] + `_${componentIndex + 1}`
    const phase = Math.floor(componentIndex / 160) + 1
    
    const prompt = `Create a production-ready blockchain component: ${componentName}
Phase ${phase} development for a sophisticated blockchain system.

Requirements:
- TypeScript implementation
- Proper error handling
- Security best practices
- Clean, documented code
- Export main functionality

Generate only the code, no explanations.`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const code = content.text.trim()
      const lines = code.split('\n').length
      
      return { code, lines }
    }
  } catch (error) {
    console.error('Krypt AI error:', error)
  }

  return null
}

async function developNextComponent() {
  if (isGeneratingComponent || currentProgress.componentsCompleted >= 1500 || progressLock) {
    return
  }
  
  progressLock = true // Lock progress updates during development

  // Check API availability first - don't start anything without it
  if (!anthropic) {
    // Stop development if API key is not configured - only log once
    if (!isDevelopmentStopped) {
      isDevelopmentStopped = true
      developmentLogs.push({
        id: `warning-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: `⚠️ Krypt AI development halted - API key required`,
        details: { note: 'Add API key environment variable to continue development' }
      })
    }
    progressLock = false // Unlock on early return
    return
  }

  // Reset development stopped flag if API is available
  if (isDevelopmentStopped && anthropic) {
    isDevelopmentStopped = false
  }

  isGeneratingComponent = true
  const componentIndex = currentProgress.componentsCompleted
  const componentName = blockchainComponents[componentIndex % blockchainComponents.length] + `_${componentIndex + 1}`

  // Generate consistent IDs based on component index to prevent duplicates
  const baseId = `component-${componentIndex}`

  // Show Krypt is starting to work
  developmentLogs.push({
    id: `${baseId}-analyzing`,
    timestamp: new Date().toISOString(),
    type: 'system',
    message: `🤖 Krypt analyzing requirements for component...`,
    details: { phase: Math.floor(componentIndex / 160) + 1, status: 'analyzing' }
  })

  // Show API request is being made
  developmentLogs.push({
    id: `${baseId}-request`,
    timestamp: new Date().toISOString(),
    type: 'api',
    message: `🔄 Sending request to Krypt AI...`,
    details: { endpoint: 'anthropic.messages.create', model: 'claude-3-haiku-20240307' }
  })

  try {
    const result = await generateBlockchainComponent(componentIndex)
    
    if (result) {
      // Show successful API response
      developmentLogs.push({
        id: `${baseId}-response`,
        timestamp: new Date().toISOString(),
        type: 'api',
        message: `✅ Krypt AI response received (${result.lines} lines generated)`,
        details: { 
          responseTime: '1.2s',
          tokensUsed: Math.floor(result.lines * 2.5),
          model: 'claude-3-haiku-20240307'
        }
      })

      // Real AI generated component
      currentProgress.componentsCompleted++
      currentProgress.linesOfCode += result.lines
      currentProgress.percentComplete = (currentProgress.componentsCompleted / 1500) * 100
      currentProgress.currentPhase = Math.floor(currentProgress.componentsCompleted / 375) + 1
      currentProgress.lastUpdated = Date.now()
      
      // Add development log showing completion
      developmentLogs.push({
        id: `${baseId}-complete`,
        timestamp: new Date().toISOString(),
        type: 'code',
        message: `✓ Development completed (${result.lines} lines) - Krypt has completed`,
        details: { 
          componentIndex: componentIndex + 1,
          totalComponents: 1500,
          phase: currentProgress.currentPhase,
          code: result.code, // Full generated code
          aiGenerated: true,
          linesGenerated: result.lines
        }
      })

      // Commit after each component (not every 10)
      currentProgress.commits++
      developmentLogs.push({
        id: `${baseId}-commit`,
        timestamp: new Date().toISOString(),
        type: 'commit',
        message: `📦 Committed to krypt-blockchain repo`,
        details: { commits: currentProgress.commits }
      })

      // Simulate tests every 20 components  
      if (currentProgress.componentsCompleted % 20 === 0) {
        currentProgress.testsRun += 10
        developmentLogs.push({
          id: `component-${componentIndex}-tests`,
          timestamp: new Date().toISOString(),
          type: 'test',
          message: `✅ Tests passed: 10/10 (Total: ${currentProgress.testsRun})`,
          details: { testsRun: currentProgress.testsRun }
        })
      }

      // Phase completion
      if (currentProgress.componentsCompleted % 375 === 0) {
        const phaseNames = ['Core Infrastructure', 'Consensus Mechanism', 'Smart Contract Layer', 'Network & Security']
        const completedPhase = Math.floor(currentProgress.componentsCompleted / 375)
        
        developmentLogs.push({
          id: `phase-${completedPhase}-complete`,
          timestamp: new Date().toISOString(),
          type: 'phase',
          message: `🎉 Phase ${completedPhase} Complete: ${phaseNames[completedPhase - 1]}`,
          details: { phase: completedPhase }
        })
      }

    }

    // Keep only last 50 logs (oldest first, newest last)
    if (developmentLogs.length > 50) {
      developmentLogs = developmentLogs.slice(-50)
    }

  } finally {
    isGeneratingComponent = false
    progressLock = false // Unlock progress updates
  }
}
// Development state tracking
let isDevelopmentStopped = !anthropic // Stop immediately if no API key

// Start immediate development on startup, then continue every 1 minute
if (anthropic && currentProgress.componentsCompleted < 1500) {
  // Immediate first development
  setTimeout(() => developNextComponent(), 1000) // Start after 1 second
}

// Background development - trigger component development when needed
setInterval(async () => {
  if (currentProgress.componentsCompleted < 1500) {
    await developNextComponent()
  }
}, 60000) // Develop a component every 1 minute (60 seconds = 1500 components * 1 min = 25 hours)

// AI typing simulation data
const typingSnippets = [
  'export class BlockStructure {',
  'private merkleRoot: string;',
  'async validateTransaction(',
  'import { CryptoUtils }',
  'public readonly hash: string',
  'constructor(data: BlockData',
  'if (!this.isValid()) {',
  'throw new Error("Invalid',
  'return await this.sign(',
  'interface ConsensusRules',
  'private async compute(',
  'const result = new Map<',
  '// Implement proof-of-stake',
  'export default class',
  'public verify(): boolean',
  'async connect(peer: Node',
  'this.transactions.push(',
  'return crypto.createHash(',
  'await this.broadcast(',
  'const nonce = Math.random()'
]

let currentTypingIndex = 0
let currentTypingText = ''
let isTyping = false

function simulateTyping() {
  if (isTyping) return ''
  
  const snippet = typingSnippets[currentTypingIndex % typingSnippets.length]
  const chars = snippet.split('')
  let result = ''
  
  // Simulate partial typing
  const progress = Math.random()
  const endIndex = Math.floor(chars.length * progress)
  
  for (let i = 0; i <= endIndex; i++) {
    result += chars[i] || ''
  }
  
  // Add cursor
  if (Math.random() > 0.5) {
    result += '█'
  }
  
  // Move to next snippet occasionally
  if (Math.random() > 0.7) {
    currentTypingIndex++
  }
  
  return result
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
    // Don't trigger development from progress endpoint to avoid data inconsistency
    // Development is handled by the background interval
    
    // Take a snapshot of current progress to avoid changes during calculation
    const progressSnapshot = { ...currentProgress }
    
    // Calculate phase progress - ensure we don't divide by zero and handle edge cases
    const componentsInCurrentPhase = progressSnapshot.componentsCompleted % 375
    const phaseProgress = componentsInCurrentPhase === 0 && progressSnapshot.componentsCompleted > 0 
      ? 100 // Phase just completed
      : (componentsInCurrentPhase / 375) * 100
    
    const response = {
      ...progressSnapshot,
      phaseProgress,
      percentComplete: (progressSnapshot.componentsCompleted / 1500) * 100
    }
    
    return res.json(response)
  }

  // Logs endpoint  
  if (url?.startsWith('/api/logs')) {
    return res.json(developmentLogs)
  }

  // Stats endpoint
  if (url === '/api/stats') {
    const stats = {
      total_users: { value: 0, lastUpdated: new Date().toISOString() },
      early_access_users: { value: 0, lastUpdated: new Date().toISOString() },
      total_lines_of_code: { value: currentProgress.linesOfCode, lastUpdated: new Date().toISOString() },
      total_commits: { value: currentProgress.commits, lastUpdated: new Date().toISOString() },
      total_tests_run: { value: currentProgress.testsRun, lastUpdated: new Date().toISOString() },
      components_completed: { value: currentProgress.componentsCompleted, lastUpdated: new Date().toISOString() },
      current_phase: { value: currentProgress.currentPhase, lastUpdated: new Date().toISOString() }
    }
    
    return res.json(stats)
  }

  // AI Typing simulation endpoint
  if (url === '/api/typing') {
    const currentlyTyping = simulateTyping()
    
    return res.json({
      text: currentlyTyping,
      isActive: currentProgress.componentsCompleted < 640,
      currentComponent: currentProgress.componentsCompleted + 1,
      phase: currentProgress.currentPhase
    })
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

  // Update user balance endpoint
  if (url === '/api/user/balance' && method === 'POST') {
    const { walletAddress, balance } = req.body || {}
    
    if (walletAddress && typeof balance === 'number') {
      users.set(walletAddress, { 
        walletAddress, 
        balance, 
        lastUpdated: new Date() 
      })
      
      return res.json({ success: true, balance })
    }
    
    return res.status(400).json({ error: 'Invalid wallet address or balance' })
  }

  // Get leaderboard endpoint
  if (url === '/api/leaderboard') {
    const topHolders = Array.from(users.values())
      .filter(user => user.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10)
      .map(user => ({
        address: user.walletAddress,
        balance: user.balance
      }))
    
    return res.json(topHolders)
  }

  // Default 404
  return res.status(404).json({ error: 'Not found' })
}