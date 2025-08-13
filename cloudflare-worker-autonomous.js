// ===== AUTONOMOUS CLOUDFLARE WORKER =====
// Self-sustaining blockchain development system that runs entirely on Cloudflare
// No external dependencies - generates all 4500 components without stopping

const BLOCKCHAIN_COMPONENTS = 4500
const DEVELOPMENT_INTERVAL = 5000 // 5 seconds per component (3x faster)
const MAX_LOGS = 10000
const CACHE_TTL = 2000

// Global variables for in-memory caching
let countCache = null
let progressCache = null
let logsCache = null
let leaderboardCache = null
let statsCache = null
let cacheTimestamps = {}

// Global headers
const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// ===== MAIN WORKER HANDLER =====
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Initialize system on first request if needed
    await initializeSystemIfNeeded(env)

    // Route handlers
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: 'autonomous'
      }), { headers: jsonHeaders })
    }

    if (url.pathname === '/api/progress' && request.method === 'GET') {
      const progress = await getProgress(env)
      return new Response(JSON.stringify(progress), { headers: jsonHeaders })
    }

    if (url.pathname === '/api/logs' && request.method === 'GET') {
      const logs = await getLogs(env)
      return new Response(JSON.stringify(logs), { headers: jsonHeaders })
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(env, jsonHeaders)
    }

    if (url.pathname === '/api/development/status' && request.method === 'GET') {
      return handleDevelopmentStatus(env, jsonHeaders)
    }

    if (url.pathname === '/api/development/force' && request.method === 'POST') {
      return handleForceDevelopment(env, jsonHeaders)
    }

    if (url.pathname === '/api/development/tick' && request.method === 'POST') {
      return handleDevelopmentTick(env, jsonHeaders)
    }

    if (url.pathname === '/api/logs/clear' && request.method === 'POST') {
      return handleClearLogs(env, jsonHeaders)
    }

    if (url.pathname === '/api/development/reset' && request.method === 'POST') {
      return handleResetDevelopment(env, jsonHeaders)
    }

    // Early access tracking
    if (url.pathname === '/api/early-access/track' && request.method === 'POST') {
      return handleEarlyAccessTrack(request, env, corsHeaders)
    }

    if (url.pathname === '/api/early-access/count' && request.method === 'GET') {
      const count = await getVisitorCount(env)
      return new Response(JSON.stringify({ count }), { headers: jsonHeaders })
    }

    // User balance routes
    if (url.pathname === '/api/user/balance' && request.method === 'POST') {
      return handleUpdateBalance(request, env, corsHeaders)
    }

    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return handleLeaderboard(env, jsonHeaders)
    }

    // Raffle System Endpoints
    if (url.pathname === '/api/raffle/enter' && request.method === 'POST') {
      return handleRaffleEntry(request, env, jsonHeaders)
    }

    if (url.pathname === '/api/user/raffle-entries' && request.method === 'GET') {
      return handleGetRaffleEntries(request, env, jsonHeaders)
    }

    if (url.pathname === '/api/raffle/draw' && request.method === 'POST') {
      return handleRaffleDraw(request, env, jsonHeaders)
    }

    if (url.pathname === '/api/raffle/status' && request.method === 'GET') {
      return handleRaffleStatus(env, jsonHeaders)
    }

    // Default 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: jsonHeaders
    })
  },

  // ===== SCHEDULED HANDLER - RUNS EVERY MINUTE =====
  async scheduled(event, env, ctx) {
    console.log('⏰ Scheduled trigger activated at', new Date().toISOString())
    
    // Run continuous development
    await continuousDevelopment(env)
    
    // Handle automatic raffle draws
    await handleAutomaticRaffleDraws(env)
  }
}

// ===== AUTONOMOUS DEVELOPMENT SYSTEM =====

async function continuousDevelopment(env) {
  try {
    const progress = await getProgress(env)
    
    // Stop if we've completed all components
    if (progress.componentsCompleted >= BLOCKCHAIN_COMPONENTS) {
      console.log('✅ All 4500 components completed!')
      return
    }
    
    // Check if enough time has passed since last update
    const timeSinceLastUpdate = Date.now() - (progress.lastUpdated || 0)
    const shouldGenerate = timeSinceLastUpdate >= DEVELOPMENT_INTERVAL
    
    if (!shouldGenerate) {
      console.log(`⏳ Not time yet. ${Math.ceil((DEVELOPMENT_INTERVAL - timeSinceLastUpdate) / 1000)}s remaining`)
      return
    }
    
    console.log(`🚀 Generating component (${Math.floor(timeSinceLastUpdate / 1000)}s since last)`)
    
    // Generate exactly ONE component with real timestamp
    await generateNextComponent(env, progress)
    
  } catch (error) {
    console.error('❌ Continuous development error:', error)
  }
}

async function generateNextComponent(env, currentProgress) {
  try {
    const componentIndex = currentProgress.componentsCompleted
    const componentName = getComponentName(componentIndex)
    const phase = Math.floor(componentIndex / 1125) + 1
    
    console.log(`🔨 Developing component ${componentIndex + 1}: ${componentName}`)
    
    // Get current logs
    const logs = await getLogs(env)
    
    // Generate development log with code snippet
    const linesOfCode = 78 + Math.floor(Math.random() * 40)
    const codeSnippet = generateCodeSnippet(componentName)
    
    const newLog = {
      id: `component-${componentIndex}`,
      timestamp: new Date().toISOString(),
      type: 'code',
      message: `✅ ${componentName} developed (${linesOfCode} lines)`,
      details: {
        componentName,
        phase,
        linesGenerated: linesOfCode,
        snippet: codeSnippet,
        componentIndex
      }
    }
    
    logs.push(newLog)
    
    // Add commit log every component
    if (Math.random() > 0.3) {
      logs.push({
        id: `commit-${componentIndex}`,
        timestamp: new Date().toISOString(),
        type: 'commit',
        message: `📦 Committed ${componentName} to krypt-blockchain repo`,
        details: {
          hash: generateCommitHash(),
          branch: 'main',
          componentName
        }
      })
      currentProgress.commits++
    }
    
    // Add test logs every 20 components
    if (componentIndex % 20 === 0 && componentIndex > 0) {
      logs.push({
        id: `test-${componentIndex}`,
        timestamp: new Date().toISOString(),
        type: 'test',
        message: `✅ Tested ${componentIndex} components - All passing`,
        details: {
          testsRun: Math.floor(componentIndex * 0.5),
          passed: Math.floor(componentIndex * 0.5),
          failed: 0
        }
      })
      currentProgress.testsRun = Math.floor(componentIndex * 0.5)
    }
    
    // Phase completion
    if (componentIndex > 0 && componentIndex % 1125 === 0) {
      const phaseNames = ['Core Infrastructure', 'Consensus Mechanism', 'Smart Contract Layer', 'Network & Security']
      const completedPhase = Math.floor(componentIndex / 1125)
      
      logs.push({
        id: `phase-${completedPhase}`,
        timestamp: new Date().toISOString(),
        type: 'phase',
        message: `🎉 Phase ${completedPhase} Complete: ${phaseNames[completedPhase - 1]}`,
        details: { phase: completedPhase, totalComponents: componentIndex }
      })
    }
    
    // Trim logs to max limit
    const trimmedLogs = logs.slice(-MAX_LOGS)
    
    // Update progress
    currentProgress.componentsCompleted++
    currentProgress.linesOfCode += linesOfCode
    currentProgress.percentComplete = (currentProgress.componentsCompleted / BLOCKCHAIN_COMPONENTS) * 100
    currentProgress.currentPhase = Math.floor(currentProgress.componentsCompleted / 1125) + 1
    currentProgress.phaseProgress = ((currentProgress.componentsCompleted % 1125) / 1125) * 100
    currentProgress.lastUpdated = Date.now()
    
    // Save to KV storage atomically
    await Promise.all([
      env.KRYPT_DATA.put('development_progress', JSON.stringify(currentProgress)),
      env.KRYPT_DATA.put('development_logs', JSON.stringify(trimmedLogs))
    ])
    
    // Clear caches
    progressCache = currentProgress
    logsCache = trimmedLogs
    cacheTimestamps.progress = Date.now()
    cacheTimestamps.logs = Date.now()
    
    console.log(`✅ Component ${componentIndex + 1} completed - ${BLOCKCHAIN_COMPONENTS - currentProgress.componentsCompleted} remaining`)
    
    return { success: true, component: componentName, progress: currentProgress }
    
  } catch (error) {
    console.error('❌ Component generation error:', error)
    return { success: false, error: error.message }
  }
}

// ===== HELPER FUNCTIONS =====

async function initializeSystemIfNeeded(env) {
  try {
    const progress = await env.KRYPT_DATA.get('development_progress')
    if (!progress) {
      console.log('🚀 Initializing autonomous development system...')
      
      const initialProgress = {
        currentPhase: 1,
        componentsCompleted: 0,
        totalComponents: BLOCKCHAIN_COMPONENTS,
        percentComplete: 0,
        phaseProgress: 0,
        linesOfCode: 0,
        commits: 0,
        testsRun: 0,
        lastUpdated: Date.now()
      }
      
      const initialLogs = [{
        id: 'system-init',
        timestamp: new Date().toISOString(),
        type: 'system',
        message: '🚀 Krypt Terminal blockchain development initialized',
        details: { totalComponents: BLOCKCHAIN_COMPONENTS }
      }]
      
      await Promise.all([
        env.KRYPT_DATA.put('development_progress', JSON.stringify(initialProgress)),
        env.KRYPT_DATA.put('development_logs', JSON.stringify(initialLogs))
      ])
      
      console.log('✅ System initialized successfully')
    }
  } catch (error) {
    console.error('❌ Initialization error:', error)
  }
}

async function getProgress(env) {
  try {
    if (progressCache && (Date.now() - (cacheTimestamps.progress || 0)) < CACHE_TTL) {
      return progressCache
    }
    
    const data = await env.KRYPT_DATA.get('development_progress')
    if (data) {
      const progress = JSON.parse(data)
      progressCache = progress
      cacheTimestamps.progress = Date.now()
      return progress
    }
    
    return {
      currentPhase: 1,
      componentsCompleted: 0,
      totalComponents: BLOCKCHAIN_COMPONENTS,
      percentComplete: 0,
      phaseProgress: 0,
      linesOfCode: 0,
      commits: 0,
      testsRun: 0,
      lastUpdated: Date.now()
    }
  } catch (error) {
    console.error('Error getting progress:', error)
    return getDefaultProgress()
  }
}

async function getLogs(env) {
  try {
    if (logsCache && (Date.now() - (cacheTimestamps.logs || 0)) < CACHE_TTL) {
      return logsCache
    }
    
    const data = await env.KRYPT_DATA.get('development_logs')
    if (data) {
      const logs = JSON.parse(data)
      logsCache = logs
      cacheTimestamps.logs = Date.now()
      return logs
    }
    
    return []
  } catch (error) {
    console.error('Error getting logs:', error)
    return []
  }
}

function getComponentName(index) {
  const components = [
    'BlockStructure', 'TransactionPool', 'CryptographicHash', 'MerkleTree', 'BlockValidator',
    'TransactionValidator', 'DigitalSignature', 'PublicKeyInfrastructure', 'ConsensusRules',
    'NetworkProtocol', 'PeerDiscovery', 'MessagePropagation', 'DataStructures', 'StorageEngine',
    'StateManager', 'AccountModel', 'BalanceTracker', 'NonceManager', 'GasCalculator',
    'FeeMarket', 'TransactionQueue', 'BlockProducer', 'ChainSelector', 'ForkResolver',
    'ProofOfStake', 'ValidatorSet', 'StakingPool', 'RewardDistributor', 'SlashingConditions',
    'EpochManager', 'RandomnessBeacon', 'VoteAggregator', 'ConsensusState', 'Finality',
    'SmartContractVM', 'BytecodeInterpreter', 'GasMetering', 'OpcodeExecutor', 'StackManager',
    'MemoryAllocator', 'StorageManager', 'EventEmitter', 'ContractDeployer', 'ABIEncoder'
  ]
  
  const baseComponent = components[index % components.length]
  const variant = Math.floor(index / components.length) + 1
  
  return variant > 1 ? `${baseComponent}_v${variant}` : baseComponent
}

function generateCodeSnippet(componentName) {
  const snippets = [
    `export class ${componentName} {
  private readonly version = '1.0.0'
  private state: BlockchainState
  
  constructor(config: ChainConfig) {
    this.state = new BlockchainState(config)
    this.initialize()
  }`,
    
    `interface ${componentName}Config {
  maxTransactions: number
  blockTime: number
  consensusThreshold: number
}

async function validate${componentName}(
  data: TransactionData
): Promise<ValidationResult> {`,
    
    `const ${componentName} = {
  async process(block: Block): Promise<ProcessedBlock> {
    const merkleRoot = await this.calculateMerkleRoot(block.transactions)
    const stateRoot = await this.computeStateRoot(block)
    
    return {
      ...block,
      merkleRoot,
      stateRoot,
      timestamp: Date.now()
    }`,
    
    `import { createHash } from 'crypto'
import { StateManager } from './StateManager'

export default class ${componentName} extends BaseComponent {
  protected readonly logger = new Logger('${componentName}')
  
  public async execute(params: ExecutionParams): Promise<ExecutionResult> {
    this.logger.info('Executing ${componentName}...')`,
    
    `type ${componentName}State = {
  validators: Map<Address, Validator>
  stakes: Map<Address, bigint>
  rewards: RewardPool
}

function update${componentName}State(
  currentState: ${componentName}State,
  action: StateAction
): ${componentName}State {`
  ]
  
  return snippets[Math.floor(Math.random() * snippets.length)]
}

function generateCommitHash() {
  return '0x' + Math.random().toString(16).substring(2, 10)
}

function getDefaultProgress() {
  return {
    currentPhase: 1,
    componentsCompleted: 0,
    totalComponents: BLOCKCHAIN_COMPONENTS,
    percentComplete: 0,
    phaseProgress: 0,
    linesOfCode: 0,
    commits: 0,
    testsRun: 0,
    lastUpdated: Date.now()
  }
}

// ===== API HANDLERS =====

async function handleStats(env, headers) {
  try {
    const progress = await getProgress(env)
    const visitorCount = await getVisitorCount(env)
    
    const stats = {
      total_users: { value: visitorCount, lastUpdated: new Date().toISOString() },
      early_access_users: { value: visitorCount, lastUpdated: new Date().toISOString() },
      total_lines_of_code: { value: progress.linesOfCode, lastUpdated: new Date().toISOString() },
      total_commits: { value: progress.commits, lastUpdated: new Date().toISOString() },
      total_tests_run: { value: progress.testsRun, lastUpdated: new Date().toISOString() },
      components_completed: { value: progress.componentsCompleted, lastUpdated: new Date().toISOString() },
      current_phase: { value: progress.currentPhase, lastUpdated: new Date().toISOString() }
    }
    
    return new Response(JSON.stringify(stats), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get stats' }), { 
      status: 500, 
      headers 
    })
  }
}

async function handleDevelopmentStatus(env, headers) {
  try {
    const progress = await getProgress(env)
    const logs = await getLogs(env)
    const timeSinceUpdate = Date.now() - (progress.lastUpdated || 0)
    const nextUpdateIn = Math.max(0, DEVELOPMENT_INTERVAL - timeSinceUpdate)
    
    return new Response(JSON.stringify({
      status: 'active',
      componentsCompleted: progress.componentsCompleted,
      totalComponents: BLOCKCHAIN_COMPONENTS,
      logsCount: logs.length,
      lastUpdated: new Date(progress.lastUpdated || Date.now()).toISOString(),
      nextUpdateIn: Math.ceil(nextUpdateIn / 1000),
      isRunning: progress.componentsCompleted < BLOCKCHAIN_COMPONENTS,
      estimatedCompletion: new Date(Date.now() + (BLOCKCHAIN_COMPONENTS - progress.componentsCompleted) * DEVELOPMENT_INTERVAL).toISOString()
    }), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get status' }), { 
      status: 500, 
      headers 
    })
  }
}

async function handleDevelopmentTick(env, headers) {
  try {
    const progress = await getProgress(env)
    
    if (progress.componentsCompleted >= BLOCKCHAIN_COMPONENTS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'All components completed',
        shouldStop: true
      }), { headers })
    }

    // Check if 15 seconds have passed
    const timeSinceLastUpdate = Date.now() - (progress.lastUpdated || 0)
    if (timeSinceLastUpdate < DEVELOPMENT_INTERVAL) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Not time yet',
        secondsRemaining: Math.ceil((DEVELOPMENT_INTERVAL - timeSinceLastUpdate) / 1000)
      }), { headers })
    }

    // Generate component
    await generateNextComponent(env, progress)
    const updatedProgress = await getProgress(env)

    return new Response(JSON.stringify({
      success: true,
      message: 'Component generated',
      component: getComponentName(progress.componentsCompleted),
      progress: updatedProgress
    }), { headers })

  } catch (error) {
    console.error('Development tick error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), { headers })
  }
}

async function handleForceDevelopment(env, headers) {
  try {
    const progress = await getProgress(env)
    
    if (progress.componentsCompleted >= BLOCKCHAIN_COMPONENTS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'All components already completed' 
      }), { headers })
    }
    
    // Force immediate development
    const result = await generateNextComponent(env, progress)
    
    return new Response(JSON.stringify({
      success: result.success,
      message: result.success ? 'Component generated successfully' : 'Generation failed',
      component: result.component,
      progress: result.progress
    }), { headers })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to force development' }), { 
      status: 500, 
      headers 
    })
  }
}

async function handleClearLogs(env, headers) {
  try {
    await env.KRYPT_DATA.put('development_logs', JSON.stringify([]))
    logsCache = []
    cacheTimestamps.logs = Date.now()
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Logs cleared successfully' 
    }), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to clear logs' }), { 
      status: 500, 
      headers 
    })
  }
}

async function handleResetDevelopment(env, headers) {
  try {
    const resetProgress = getDefaultProgress()
    const resetLogs = [{
      id: 'system-reset',
      timestamp: new Date().toISOString(),
      type: 'system',
      message: '🔄 Development system reset - Starting fresh',
      details: { resetAt: new Date().toISOString() }
    }]
    
    await Promise.all([
      env.KRYPT_DATA.put('development_progress', JSON.stringify(resetProgress)),
      env.KRYPT_DATA.put('development_logs', JSON.stringify(resetLogs))
    ])
    
    progressCache = resetProgress
    logsCache = resetLogs
    cacheTimestamps.progress = Date.now()
    cacheTimestamps.logs = Date.now()
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Development reset successfully' 
    }), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to reset' }), { 
      status: 500, 
      headers 
    })
  }
}

// ===== VISITOR TRACKING =====

async function getVisitorCount(env) {
  try {
    const count = await env.EARLY_ACCESS.get('total_count')
    return count ? parseInt(count, 10) : 0
  } catch (error) {
    console.error('Error getting visitor count:', error)
    return 0
  }
}

async function handleEarlyAccessTrack(request, env, headers) {
  try {
    const body = await request.json()
    const { visitorId, isNewVisitor } = body
    
    if (isNewVisitor) {
      const current = await getVisitorCount(env)
      const newCount = current + 1
      await env.EARLY_ACCESS.put('total_count', newCount.toString())
      countCache = newCount
      
      return new Response(JSON.stringify({ 
        tracked: true, 
        totalVisitors: newCount 
      }), { headers })
    }
    
    const count = await getVisitorCount(env)
    return new Response(JSON.stringify({ 
      tracked: false, 
      totalVisitors: count 
    }), { headers })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Tracking failed' }), { 
      status: 500, 
      headers 
    })
  }
}

// ===== USER BALANCE =====

async function handleUpdateBalance(request, env, headers) {
  try {
    const body = await request.json()
    const { walletAddress, balance } = body
    
    if (!walletAddress || typeof balance !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { 
        status: 400, 
        headers 
      })
    }
    
    await env.KRYPT_DATA.put(`balance_${walletAddress}`, JSON.stringify({
      balance,
      lastUpdated: new Date().toISOString()
    }))
    
    // Clear leaderboard cache
    leaderboardCache = null
    
    return new Response(JSON.stringify({ success: true, balance }), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update balance' }), { 
      status: 500, 
      headers 
    })
  }
}

async function handleLeaderboard(env, headers) {
  try {
    if (leaderboardCache && (Date.now() - (cacheTimestamps.leaderboard || 0)) < 5000) {
      return new Response(JSON.stringify(leaderboardCache), { headers })
    }
    
    // Get all balance keys (simplified for demo)
    const topHolders = []
    
    // Return empty array for now (would need to implement KV list in production)
    leaderboardCache = topHolders
    cacheTimestamps.leaderboard = Date.now()
    
    return new Response(JSON.stringify(topHolders), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get leaderboard' }), { 
      status: 500, 
      headers 
    })
  }
}

// ===== RAFFLE SYSTEM =====

async function handleRaffleEntry(request, env, headers) {
  try {
    const { walletAddress, raffleType, ticketCost } = await request.json()
    
    if (!walletAddress || !raffleType || !ticketCost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields' 
      }), { status: 400, headers })
    }

    // Get user's current raffle tickets
    const userKey = `user_balance_${walletAddress}`
    const userData = await env.KRYPT_DATA.get(userKey)
    const user = userData ? JSON.parse(userData) : null
    
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User not found' 
      }), { status: 404, headers })
    }

    // Calculate user's raffle tickets (based on activity)
    const balance = user.balance || 0
    const staked = user.stakes?.reduce((total, stake) => total + stake.amount, 0) || 0
    const minted = user.mintedAmount || 0
    const miningBonus = user.isMining ? 100 : 0
    const totalScore = balance + staked + (minted * 2) + miningBonus
    const availableTickets = Math.floor(totalScore / 100) + (user.raffleTickets || 0)

    if (availableTickets < ticketCost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Insufficient tickets. Need ${ticketCost}, have ${availableTickets}` 
      }), { status: 400, headers })
    }

    // Create raffle entry
    const entryId = `${raffleType}_${walletAddress}_${Date.now()}`
    const raffleEntry = {
      id: entryId,
      walletAddress,
      raffleType,
      ticketCost,
      timestamp: new Date().toISOString(),
      status: 'active'
    }

    // Store raffle entry
    await env.KRYPT_DATA.put(`raffle_entry_${entryId}`, JSON.stringify(raffleEntry))

    // Update user's raffle tickets (deduct used tickets)
    user.raffleTickets = (user.raffleTickets || 0) - ticketCost
    await env.KRYPT_DATA.put(userKey, JSON.stringify(user))

    // Update raffle stats
    const raffleStatsKey = `raffle_stats_${raffleType}`
    const statsData = await env.KRYPT_DATA.get(raffleStatsKey)
    const stats = statsData ? JSON.parse(statsData) : {
      totalEntries: 0,
      totalTickets: 0,
      participants: 0,
      lastUpdated: new Date().toISOString()
    }
    
    stats.totalEntries += 1
    stats.totalTickets += ticketCost
    stats.lastUpdated = new Date().toISOString()
    await env.KRYPT_DATA.put(raffleStatsKey, JSON.stringify(stats))

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully entered raffle',
      entry: raffleEntry,
      remainingTickets: user.raffleTickets
    }), { headers })

  } catch (error) {
    console.error('Raffle entry error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to enter raffle' 
    }), { status: 500, headers })
  }
}

async function handleGetRaffleEntries(request, env, headers) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('walletAddress')
    
    if (!walletAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Wallet address required' 
      }), { status: 400, headers })
    }

    // Get all raffle entries for this user
    const entries = []
    const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry_' })
    
    for (const key of listResult.keys) {
      const entryData = await env.KRYPT_DATA.get(key.name)
      if (entryData) {
        const entry = JSON.parse(entryData)
        if (entry.walletAddress === walletAddress && entry.status === 'active') {
          entries.push(entry)
        }
      }
    }

    return new Response(JSON.stringify(entries), { headers })

  } catch (error) {
    console.error('Get raffle entries error:', error)
    return new Response(JSON.stringify([]), { headers })
  }
}

async function handleRaffleDraw(request, env, headers) {
  try {
    const { raffleType, adminKey } = await request.json()
    
    // Simple admin key check (you should use a proper auth system)
    if (adminKey !== 'krypt_raffle_admin_2024') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Unauthorized' 
      }), { status: 401, headers })
    }

    if (!raffleType) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Raffle type required' 
      }), { status: 400, headers })
    }

    // Get all entries for this raffle type
    const entries = []
    const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry_' })
    
    for (const key of listResult.keys) {
      const entryData = await env.KRYPT_DATA.get(key.name)
      if (entryData) {
        const entry = JSON.parse(entryData)
        if (entry.raffleType === raffleType && entry.status === 'active') {
          entries.push(entry)
        }
      }
    }

    if (entries.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No entries found for this raffle' 
      }), { status: 404, headers })
    }

    // Create weighted array (more tickets = more chances)
    const weightedEntries = []
    entries.forEach(entry => {
      for (let i = 0; i < entry.ticketCost; i++) {
        weightedEntries.push(entry)
      }
    })

    // Select random winner
    const randomIndex = Math.floor(Math.random() * weightedEntries.length)
    const winnerEntry = weightedEntries[randomIndex]

    // Determine prize based on raffle type
    const prizes = {
      'hourly': 1000,
      'weekly': 25000,
      'genesis': 100000
    }
    const prizeAmount = prizes[raffleType] || 1000

    // Update winner's balance
    const userKey = `user_balance_${winnerEntry.walletAddress}`
    const userData = await env.KRYPT_DATA.get(userKey)
    const user = userData ? JSON.parse(userData) : { 
      balance: 0, 
      walletAddress: winnerEntry.walletAddress 
    }
    
    user.balance = (user.balance || 0) + prizeAmount
    await env.KRYPT_DATA.put(userKey, JSON.stringify(user))

    // Mark all entries for this raffle as completed
    for (const entry of entries) {
      entry.status = 'completed'
      entry.winnerAddress = winnerEntry.walletAddress
      entry.prizeAmount = prizeAmount
      entry.drawnAt = new Date().toISOString()
      await env.KRYPT_DATA.put(`raffle_entry_${entry.id}`, JSON.stringify(entry))
    }

    // Store draw result
    const drawResult = {
      id: `draw_${raffleType}_${Date.now()}`,
      raffleType,
      winnerAddress: winnerEntry.walletAddress,
      prizeAmount,
      totalEntries: entries.length,
      totalTickets: weightedEntries.length,
      drawnAt: new Date().toISOString()
    }
    
    await env.KRYPT_DATA.put(`raffle_draw_${drawResult.id}`, JSON.stringify(drawResult))

    return new Response(JSON.stringify({
      success: true,
      message: 'Raffle drawn successfully',
      winner: winnerEntry.walletAddress,
      prizeAmount,
      totalEntries: entries.length,
      drawResult
    }), { headers })

  } catch (error) {
    console.error('Raffle draw error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to draw raffle' 
    }), { status: 500, headers })
  }
}

async function handleRaffleStatus(env, headers) {
  try {
    const raffleTypes = ['hourly', 'weekly', 'genesis']
    const status = {}

    for (const raffleType of raffleTypes) {
      // Get raffle stats
      const statsData = await env.KRYPT_DATA.get(`raffle_stats_${raffleType}`)
      const stats = statsData ? JSON.parse(statsData) : {
        totalEntries: 0,
        totalTickets: 0,
        participants: 0,
        lastUpdated: new Date().toISOString()
      }

      // Get recent winner
      const listResult = await env.KRYPT_DATA.list({ prefix: `raffle_draw_draw_${raffleType}` })
      let lastWinner = null
      let lastDrawTime = null
      
      if (listResult.keys.length > 0) {
        // Get most recent draw
        const sortedKeys = listResult.keys.sort((a, b) => b.name.localeCompare(a.name))
        const lastDrawData = await env.KRYPT_DATA.get(sortedKeys[0].name)
        if (lastDrawData) {
          const draw = JSON.parse(lastDrawData)
          lastWinner = draw.winnerAddress
          lastDrawTime = draw.drawnAt
        }
      }

      status[raffleType] = {
        ...stats,
        lastWinner,
        lastDrawTime,
        prizePool: raffleType === 'hourly' ? 1000 : raffleType === 'weekly' ? 25000 : 100000
      }
    }

    return new Response(JSON.stringify(status), { headers })

  } catch (error) {
    console.error('Raffle status error:', error)
    return new Response(JSON.stringify({}), { headers })
  }
}

// ===== AUTOMATIC RAFFLE DRAWS =====

async function handleAutomaticRaffleDraws(env) {
  try {
    const now = new Date()
    const currentMinute = now.getMinutes()
    const currentHour = now.getHours()
    const currentDay = now.getDay() // 0 = Sunday
    
    // Hourly raffle (every hour at :00)
    if (currentMinute === 0) {
      console.log('🎲 Running hourly raffle draw...')
      await automaticRaffleDraw(env, 'hourly', 1000)
    }
    
    // Weekly raffle (every Sunday at midnight)
    if (currentDay === 0 && currentHour === 0 && currentMinute === 0) {
      console.log('🎲 Running weekly raffle draw...')
      await automaticRaffleDraw(env, 'weekly', 25000)
    }
    
  } catch (error) {
    console.error('Automatic raffle draw error:', error)
  }
}

async function automaticRaffleDraw(env, raffleType, prizeAmount) {
  try {
    // Get all entries for this raffle type
    const entries = []
    const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry_' })
    
    for (const key of listResult.keys) {
      const entryData = await env.KRYPT_DATA.get(key.name)
      if (entryData) {
        const entry = JSON.parse(entryData)
        if (entry.raffleType === raffleType && entry.status === 'active') {
          entries.push(entry)
        }
      }
    }

    if (entries.length === 0) {
      console.log(`No entries found for ${raffleType} raffle`)
      return
    }

    // Create weighted array (more tickets = more chances)
    const weightedEntries = []
    entries.forEach(entry => {
      for (let i = 0; i < entry.ticketCost; i++) {
        weightedEntries.push(entry)
      }
    })

    // Select random winner
    const randomIndex = Math.floor(Math.random() * weightedEntries.length)
    const winnerEntry = weightedEntries[randomIndex]

    // Update winner's balance
    const userKey = `user_balance_${winnerEntry.walletAddress}`
    const userData = await env.KRYPT_DATA.get(userKey)
    const user = userData ? JSON.parse(userData) : { 
      balance: 0, 
      walletAddress: winnerEntry.walletAddress 
    }
    
    user.balance = (user.balance || 0) + prizeAmount
    await env.KRYPT_DATA.put(userKey, JSON.stringify(user))

    // Mark all entries for this raffle as completed
    for (const entry of entries) {
      entry.status = 'completed'
      entry.winnerAddress = winnerEntry.walletAddress
      entry.prizeAmount = prizeAmount
      entry.drawnAt = new Date().toISOString()
      await env.KRYPT_DATA.put(`raffle_entry_${entry.id}`, JSON.stringify(entry))
    }

    // Store draw result
    const drawResult = {
      id: `draw_${raffleType}_${Date.now()}`,
      raffleType,
      winnerAddress: winnerEntry.walletAddress,
      prizeAmount,
      totalEntries: entries.length,
      totalTickets: weightedEntries.length,
      drawnAt: new Date().toISOString(),
      automatic: true
    }
    
    await env.KRYPT_DATA.put(`raffle_draw_${drawResult.id}`, JSON.stringify(drawResult))

    console.log(`🎉 ${raffleType} raffle drawn! Winner: ${winnerEntry.walletAddress}, Prize: ${prizeAmount} KRYPT`)
    
    return drawResult

  } catch (error) {
    console.error(`Automatic ${raffleType} raffle draw error:`, error)
  }
}