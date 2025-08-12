// Enhanced Cloudflare Worker with Auto-progression and Mock Data
// Handles: Visitor Tracking, Development Progress, Logs, Leaderboard, User Balances

// In-memory caches for immediate consistency
let countCache = null
let progressCache = null
let logsCache = null
let leaderboardCache = null
let cacheTimestamps = {}
const CACHE_TTL = 2000 // 2 seconds for faster updates

// Development configuration
const BLOCKCHAIN_COMPONENTS = 4500

// No mock data - use real user balances only

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Visitor Tracking Routes
    if (url.pathname === '/api/early-access/visit' && request.method === 'POST') {
      return handleVisit(request, env, corsHeaders)
    }
    if (url.pathname === '/api/early-access/count' && request.method === 'GET') {
      return handleCount(env, corsHeaders)
    }
    if (url.pathname === '/api/early-access/stream' && request.method === 'GET') {
      return handleStream(env, corsHeaders)
    }

    // Development Progress Routes
    if (url.pathname === '/api/progress' && request.method === 'GET') {
      return handleGetProgress(env, corsHeaders)
    }
    if (url.pathname === '/api/progress/update' && request.method === 'POST') {
      return handleUpdateProgress(request, env, corsHeaders)
    }
    if (url.pathname === '/api/progress/reset' && request.method === 'POST') {
      return handleProgressReset(request, env, corsHeaders)
    }
    
    // Master Reset for Launch
    if (url.pathname === '/api/admin/reset-all' && request.method === 'POST') {
      return handleMasterReset(request, env, corsHeaders)
    }
    
    // Manual count adjustment
    if (url.pathname === '/api/admin/set-count' && request.method === 'POST') {
      return handleSetCount(request, env, corsHeaders)
    }
    
    // Clear all visitor records for testing
    if (url.pathname === '/api/admin/clear-visitors' && request.method === 'POST') {
      return handleClearVisitors(request, env, corsHeaders)
    }

    // Development Logs Routes (internal handling)
    if (url.pathname === '/api/logs' && request.method === 'GET') {
      return handleGetLogs(env, corsHeaders)
    }
    if (url.pathname === '/api/typing' && request.method === 'GET') {
      return handleTyping(env, corsHeaders)
    }
    if (url.pathname === '/api/session' && request.method === 'POST') {
      return handleSession(request, corsHeaders)
    }
    
    // Development trigger (for testing)
    if (url.pathname === '/api/develop' && request.method === 'POST') {
      const result = await triggerDevelopment(env)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Statistics Routes
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(env, corsHeaders)
    }

    // User Balance Routes
    if (url.pathname === '/api/user/balance' && request.method === 'POST') {
      return handleUpdateBalance(request, env, corsHeaders)
    }

    // Leaderboard Routes - Returns real user data
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return handleLeaderboard(env, corsHeaders)
    }

    // Manual progress update
    if (url.pathname === '/api/admin/set-progress' && request.method === 'POST') {
      return handleSetProgress(request, env, corsHeaders)
    }

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'production'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response('Krypt Terminal API', { 
      status: 404,
      headers: corsHeaders 
    })
  }
}

// ===== ADMIN: SET PROGRESS =====
async function handleSetProgress(request, env, corsHeaders) {
  try {
    const { adminKey, componentsCompleted } = await request.json()
    
    if (adminKey !== 'krypt_master_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const progress = getDefaultProgress()
    progress.componentsCompleted = Math.min(componentsCompleted, BLOCKCHAIN_COMPONENTS)
    progress.percentComplete = (progress.componentsCompleted / BLOCKCHAIN_COMPONENTS) * 100
    progress.currentPhase = Math.min(Math.floor(progress.componentsCompleted / 1125) + 1, 4)
    progress.phaseProgress = ((progress.componentsCompleted % 1125) / 1125) * 100
    progress.linesOfCode = progress.componentsCompleted * 78
    progress.commits = progress.componentsCompleted
    progress.testsRun = Math.floor(progress.componentsCompleted * 0.5)
    progress.lastUpdated = Date.now()
    
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(progress))
    progressCache = progress
    cacheTimestamps.progress = Date.now()

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Progress set to ${componentsCompleted} components`,
      progress: progress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Set progress error:', error)
    return new Response(JSON.stringify({ error: 'Failed to set progress' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== DEVELOPMENT LOGS HANDLER =====
async function handleGetLogs(env, corsHeaders) {
  try {
    const logs = await getLogs(env)
    return new Response(JSON.stringify(logs), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Logs error:', error)
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== DEVELOPMENT ENGINE =====
async function triggerDevelopment(env) {
  try {
    const progress = await getProgress(env)
    
    // Don't trigger if already at max or recently updated (< 10 seconds ago)
    if (progress.componentsCompleted >= BLOCKCHAIN_COMPONENTS) {
      return { success: false, reason: 'Development complete' }
    }
    
    const timeSinceUpdate = Date.now() - progress.lastUpdated
    if (timeSinceUpdate < 10000) {
      return { success: false, reason: 'Recent update, waiting...' }
    }

    // Generate new component
    const componentIndex = progress.componentsCompleted
    const componentName = getComponentName(componentIndex)
    const logs = await getLogs(env)
    
    // Add development log
    const newLog = {
      id: `component-${componentIndex}-dev`,
      timestamp: new Date().toISOString(),
      type: 'code',
      message: `✅ ${componentName} developed (${78 + Math.floor(Math.random() * 40)} lines)`,
      details: { 
        componentName: componentName,
        phase: Math.floor(componentIndex / 1125) + 1,
        snippet: generateCodeSnippet(componentName)
      }
    }
    
    logs.push(newLog)
    
    // Update progress
    progress.componentsCompleted++
    progress.linesOfCode += 78 + Math.floor(Math.random() * 40)
    progress.percentComplete = (progress.componentsCompleted / BLOCKCHAIN_COMPONENTS) * 100
    progress.currentPhase = Math.floor(progress.componentsCompleted / 1125) + 1
    progress.phaseProgress = ((progress.componentsCompleted % 1125) / 1125) * 100
    progress.commits++
    progress.lastUpdated = Date.now()
    
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50)
    }
    
    // Save updates
    await Promise.all([
      env.KRYPT_DATA.put('development_progress', JSON.stringify(progress)),
      env.KRYPT_DATA.put('development_logs', JSON.stringify(logs))
    ])
    
    // Clear caches
    progressCache = progress
    logsCache = logs
    cacheTimestamps.progress = Date.now()
    cacheTimestamps.logs = Date.now()
    
    console.log(`Development triggered: Component ${componentIndex + 1} (${componentName})`)
    
    return { success: true, component: componentName, progress: progress }
  } catch (error) {
    console.error('Development trigger error:', error)
    return { success: false, reason: error.message }
  }
}

function getComponentName(index) {
  const components = [
    'BlockStructure', 'TransactionPool', 'CryptographicHash', 'MerkleTree', 'BlockValidator',
    'TransactionValidator', 'DigitalSignature', 'PublicKeyInfrastructure', 'ConsensusRules',
    'NetworkProtocol', 'PeerDiscovery', 'MessagePropagation', 'DataStructures', 'StorageEngine',
    'ChainValidation', 'GenesisBlock', 'BlockchainCore', 'SmartContract', 'VirtualMachine',
    'StateManager', 'AccountModel', 'GasSystem', 'TransactionFee', 'MiningReward'
  ]
  return components[index % components.length] + `_${index + 1}`
}

function generateCodeSnippet(componentName) {
  const snippets = [
    `export class ${componentName} {\n  constructor(data: any) {\n    this.validate(data)\n  }\n...`,
    `interface ${componentName}Config {\n  readonly hash: string\n  validate(): boolean\n}\n...`,
    `async function create${componentName}(\n  params: CreateParams\n): Promise<${componentName}> {\n...`,
    `export default class ${componentName} {\n  private readonly _data: BlockData\n  \n  public verify(): boolean {\n...`
  ]
  return snippets[Math.floor(Math.random() * snippets.length)]
}

// ===== TYPING SIMULATION =====
async function handleTyping(env, corsHeaders) {
  const progress = await getProgress(env)
  
  // Simple typing simulation
  const typingSnippets = [
    'export class BlockStructure {█',
    'private merkleRoot: string;█',
    'async validateTransaction(█',
    'import { CryptoUtils }█',
    'public readonly hash: string█'
  ]
  
  const snippet = typingSnippets[Math.floor(Math.random() * typingSnippets.length)]
  
  return new Response(JSON.stringify({
    text: snippet,
    isActive: true,
    currentComponent: progress.componentsCompleted,
    phase: progress.currentPhase
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// ===== SESSION HANDLER =====
async function handleSession(request, corsHeaders) {
  try {
    const { sessionId, walletAddress } = await request.json()
    
    return new Response(JSON.stringify({
      user: {
        id: sessionId || 'temp-user',
        walletAddress,
        isEarlyAccess: true,
        joinedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== VISITOR TRACKING =====
async function handleVisit(request, env, corsHeaders) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = request.headers.get('User-Agent') || ''
    const country = request.cf?.country || 'unknown'
    
    if (isBot(userAgent)) {
      const count = await getVisitorCount(env)
      return new Response(JSON.stringify({ count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cookies = request.headers.get('Cookie') || ''
    const cookieMatch = cookies.match(/ea_uid=([^;]+)/)
    let visitorId = cookieMatch ? cookieMatch[1] : null

    if (!visitorId) {
      visitorId = crypto.randomUUID()
    }

    const visitorKey = `visitor:${visitorId}`
    const fingerprint = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(`${ip}:${userAgent}:${country}`)
    )
    const fingerprintHex = Array.from(new Uint8Array(fingerprint))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    const fingerprintKey = `fingerprint:${fingerprintHex}`

    const [existingVisitor, existingFingerprint] = await Promise.all([
      env.EARLY_ACCESS.get(visitorKey),
      env.EARLY_ACCESS.get(fingerprintKey)
    ])

    let count
    const now = Date.now()

    if (!existingVisitor && !existingFingerprint) {
      await Promise.all([
        env.EARLY_ACCESS.put(visitorKey, now.toString()),
        env.EARLY_ACCESS.put(fingerprintKey, visitorId, { expirationTtl: 172800 })
      ])
      
      count = await incrementVisitorCount(env)
      console.log(`New visitor: ${visitorId.substring(0, 8)}... Total: ${count}`)
    } else {
      count = await getVisitorCount(env)
    }

    return new Response(JSON.stringify({ count }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': `ea_uid=${visitorId}; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      }
    })
  } catch (error) {
    console.error('Visit tracking error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', count: 0 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleCount(env, corsHeaders) {
  try {
    const count = await getVisitorCount(env)
    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ count: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleStream(env, corsHeaders) {
  try {
    const count = await getVisitorCount(env)
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: ${JSON.stringify({ count })}\n\n`)
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    return new Response('error: Internal server error\n\n', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    })
  }
}

// ===== ADMIN FUNCTIONS =====
async function handleSetCount(request, env, corsHeaders) {
  try {
    const { adminKey, count } = await request.json()
    
    if (adminKey !== 'krypt_admin_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await env.EARLY_ACCESS.put('total_count', count.toString())
    countCache = count
    cacheTimestamps.visitor_count = Date.now()

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Visitor count set to ${count}`,
      count: count
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Set count error:', error)
    return new Response(JSON.stringify({ error: 'Failed to set count' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== NUCLEAR RESET - EVERYTHING =====
async function handleClearVisitors(request, env, corsHeaders) {
  try {
    const { adminKey } = await request.json()
    
    if (adminKey !== 'krypt_master_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset development progress to initial state
    const resetProgress = getDefaultProgress()
    resetProgress.lastUpdated = Date.now() // Set current time to prevent auto-increment
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(resetProgress))
    
    // Clear development logs
    await env.KRYPT_DATA.put('development_logs', JSON.stringify([]))

    // Get all visitor and fingerprint records
    const visitorList = await env.EARLY_ACCESS.list({ prefix: 'visitor:' })
    const fingerprintList = await env.EARLY_ACCESS.list({ prefix: 'fingerprint:' })
    
    // Delete all visitor records
    const deletePromises = []
    
    for (const key of visitorList.keys) {
      deletePromises.push(env.EARLY_ACCESS.delete(key.name))
    }
    
    for (const key of fingerprintList.keys) {
      deletePromises.push(env.EARLY_ACCESS.delete(key.name))
    }
    
    await Promise.all(deletePromises)
    
    // Reset visitor count to 0
    await env.EARLY_ACCESS.put('total_count', '0')
    
    // Clear all caches
    countCache = null
    progressCache = null
    logsCache = null
    leaderboardCache = null
    Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key])

    console.log(`NUCLEAR RESET: Cleared ${visitorList.keys.length} visitor records, ${fingerprintList.keys.length} fingerprint records, reset progress and logs`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Nuclear reset completed - EVERYTHING cleared',
      visitorsCleared: visitorList.keys.length,
      fingerprintsCleared: fingerprintList.keys.length,
      progressReset: true,
      logsReset: true,
      newCount: 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Nuclear reset error:', error)
    return new Response(JSON.stringify({ error: 'Nuclear reset failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== MASTER RESET FOR LAUNCH =====
async function handleMasterReset(request, env, corsHeaders) {
  try {
    const { adminKey, resetVisitors = false } = await request.json().catch(() => ({}))
    
    if (adminKey !== 'krypt_master_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const resetProgress = getDefaultProgress()
    resetProgress.lastUpdated = Date.now() // Set current time to prevent auto-increment
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(resetProgress))
    await env.KRYPT_DATA.put('development_logs', JSON.stringify([]))
    
    if (resetVisitors) {
      await env.EARLY_ACCESS.put('total_count', '0')
    }
    
    countCache = null
    progressCache = null
    logsCache = null
    leaderboardCache = null
    Object.keys(cacheTimestamps).forEach(key => delete cacheTimestamps[key])

    console.log('Master reset completed - ready for launch!')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'System reset for launch completed',
      resetProgress: true,
      resetLogs: true,
      resetVisitors: resetVisitors,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Master reset error:', error)
    return new Response(JSON.stringify({ error: 'Reset failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== GET PROGRESS WITH DEVELOPMENT TRIGGER =====
async function handleGetProgress(env, corsHeaders) {
  try {
    // Trigger development if enough time has passed
    const progress = await getProgress(env)
    const timeSinceUpdate = Date.now() - progress.lastUpdated
    
    // Trigger development every 15 seconds
    if (timeSinceUpdate > 15000 && progress.componentsCompleted < BLOCKCHAIN_COMPONENTS) {
      await triggerDevelopment(env)
      // Get updated progress
      const updatedProgress = await getProgress(env)
      return new Response(JSON.stringify(updatedProgress), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify(progress), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Progress error:', error)
    return new Response(JSON.stringify(getDefaultProgress()), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== UPDATE PROGRESS FROM KRYPT =====
async function handleUpdateProgress(request, env, corsHeaders) {
  try {
    const { componentsCompleted, linesOfCode, commits, testsRun, apiKey } = await request.json()
    
    // Verify this is from Krypt - allow requests without API key for now
    if (apiKey && apiKey !== 'krypt_api_key_2024') {
      console.log(`Invalid API key received: ${apiKey}`)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('Updating progress:', { componentsCompleted, linesOfCode, commits, testsRun })
    
    const progress = await getProgress(env)
    
    // Update progress with data from Krypt
    if (typeof componentsCompleted === 'number') {
      progress.componentsCompleted = Math.min(componentsCompleted, BLOCKCHAIN_COMPONENTS)
      progress.percentComplete = (progress.componentsCompleted / BLOCKCHAIN_COMPONENTS) * 100
      progress.currentPhase = Math.min(Math.floor(progress.componentsCompleted / 1125) + 1, 4)
      progress.phaseProgress = ((progress.componentsCompleted % 1125) / 1125) * 100
    }
    
    if (typeof linesOfCode === 'number') progress.linesOfCode = linesOfCode
    if (typeof commits === 'number') progress.commits = commits
    if (typeof testsRun === 'number') progress.testsRun = testsRun
    
    progress.lastUpdated = Date.now()
    
    // Save updated progress
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(progress))
    progressCache = progress
    cacheTimestamps.progress = Date.now()
    
    // Add log entry for significant milestones
    if (progress.componentsCompleted % 100 === 0 && progress.componentsCompleted > 0) {
      const logs = await getLogs(env)
      logs.push({
        id: `milestone-${progress.componentsCompleted}`,
        timestamp: new Date().toISOString(),
        type: 'system',
        message: `Krypt reached ${progress.componentsCompleted} components!`,
        details: { components: progress.componentsCompleted }
      })
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50)
      }
      
      await env.KRYPT_DATA.put('development_logs', JSON.stringify(logs))
      logsCache = logs
      cacheTimestamps.logs = Date.now()
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      progress: progress 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Update progress error:', error)
    return new Response(JSON.stringify({ error: 'Failed to update progress' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function handleProgressReset(request, env, corsHeaders) {
  try {
    const { adminKey } = await request.json().catch(() => ({}))
    
    if (adminKey !== 'krypt_admin_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const resetProgress = getDefaultProgress()
    resetProgress.lastUpdated = Date.now() // Set current time to prevent auto-increment
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(resetProgress))
    await env.KRYPT_DATA.put('development_logs', JSON.stringify([]))
    
    progressCache = null
    logsCache = null
    delete cacheTimestamps.progress
    delete cacheTimestamps.logs

    console.log('Development progress reset to initial state')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Development progress reset successfully',
      progress: resetProgress 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Progress reset error:', error)
    return new Response(JSON.stringify({ error: 'Reset failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== GET DEVELOPMENT LOGS =====
async function handleGetLogs(env, corsHeaders) {
  try {
    const logs = await getLogs(env)
    return new Response(JSON.stringify(logs), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Logs error:', error)
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== SYNC ALL LOGS FROM KRYPT =====
async function handleSyncLogs(request, env, corsHeaders) {
  try {
    const { logs, apiKey } = await request.json()
    
    // Verify this is from Krypt
    if (apiKey && apiKey !== 'krypt_api_key_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Replace all logs with the synced logs from Vercel API
    if (Array.isArray(logs)) {
      await env.KRYPT_DATA.put('development_logs', JSON.stringify(logs))
      logsCache = logs
      cacheTimestamps.logs = Date.now()
      
      console.log(`Synced ${logs.length} logs from Vercel API`)
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      logCount: logs?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Sync logs error:', error)
    return new Response(JSON.stringify({ error: 'Failed to sync logs' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== ADD DEVELOPMENT LOG FROM KRYPT =====
async function handleAddLog(request, env, corsHeaders) {
  try {
    const { log, apiKey } = await request.json()
    
    // Verify this is from Krypt (you can add proper API key verification here)
    if (apiKey && apiKey !== 'krypt_api_key_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const logs = await getLogs(env)
    
    // Add the new log
    logs.push({
      id: log.id || `log-${Date.now()}`,
      timestamp: log.timestamp || new Date().toISOString(),
      type: log.type || 'system',
      message: log.message,
      details: log.details || {}
    })
    
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50)
    }
    
    await env.KRYPT_DATA.put('development_logs', JSON.stringify(logs))
    logsCache = logs
    cacheTimestamps.logs = Date.now()
    
    return new Response(JSON.stringify({ 
      success: true,
      logCount: logs.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Add log error:', error)
    return new Response(JSON.stringify({ error: 'Failed to add log' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== STATISTICS =====
async function handleStats(env, corsHeaders) {
  try {
    const [visitorCount, progress] = await Promise.all([
      getVisitorCount(env),
      getProgress(env)
    ])

    const stats = {
      total_users: { value: visitorCount, lastUpdated: new Date().toISOString() },
      early_access_users: { value: visitorCount, lastUpdated: new Date().toISOString() },
      total_lines_of_code: { value: progress.linesOfCode || 0, lastUpdated: new Date().toISOString() },
      total_commits: { value: progress.commits || 0, lastUpdated: new Date().toISOString() },
      total_tests_run: { value: progress.testsRun || 0, lastUpdated: new Date().toISOString() },
      components_completed: { value: progress.componentsCompleted || 0, lastUpdated: new Date().toISOString() },
      current_phase: { value: progress.currentPhase || 1, lastUpdated: new Date().toISOString() }
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Stats error:', error)
    return new Response(JSON.stringify({
      total_users: { value: 0, lastUpdated: new Date().toISOString() },
      early_access_users: { value: 0, lastUpdated: new Date().toISOString() },
      total_lines_of_code: { value: 0, lastUpdated: new Date().toISOString() },
      total_commits: { value: 0, lastUpdated: new Date().toISOString() },
      total_tests_run: { value: 0, lastUpdated: new Date().toISOString() },
      components_completed: { value: 0, lastUpdated: new Date().toISOString() },
      current_phase: { value: 1, lastUpdated: new Date().toISOString() }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== USER BALANCES =====
async function handleUpdateBalance(request, env, corsHeaders) {
  try {
    const { walletAddress, balance } = await request.json()
    
    if (walletAddress && typeof balance === 'number') {
      const userData = {
        walletAddress,
        balance,
        lastUpdated: new Date().toISOString()
      }
      
      await env.KRYPT_DATA.put(`user:${walletAddress}`, JSON.stringify(userData))
      
      return new Response(JSON.stringify({ success: true, balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ error: 'Invalid wallet address or balance' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Balance update error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== LEADERBOARD WITH REAL DATA =====
async function handleLeaderboard(env, corsHeaders) {
  try {
    // List all user balance keys
    const list = await env.KRYPT_DATA.list({ prefix: 'user:' })
    const leaderboard = []
    let totalBalance = 0
    
    // Fetch all user balances
    for (const key of list.keys) {
      const userData = await env.KRYPT_DATA.get(key.name)
      if (userData) {
        const user = JSON.parse(userData)
        if (user.balance > 0) {
          leaderboard.push({
            walletAddress: user.walletAddress,
            balance: user.balance
          })
          totalBalance += user.balance
        }
      }
    }
    
    // Sort by balance descending
    leaderboard.sort((a, b) => b.balance - a.balance)
    
    // Format for Top Holders display - match frontend expectations
    const rankedLeaderboard = leaderboard.slice(0, 10).map((user, index) => ({
      address: user.walletAddress.substring(0, 6) + '...' + user.walletAddress.slice(-4),
      balance: user.balance
    }))
    
    // Log for debugging
    console.log(`Leaderboard: Found ${list.keys.length} users, ${leaderboard.length} with balance > 0`)
    
    return new Response(JSON.stringify(rankedLeaderboard), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// ===== HELPER FUNCTIONS =====

// Visitor count with caching (using EARLY_ACCESS namespace)
async function getVisitorCount(env) {
  const now = Date.now()
  const cacheKey = 'visitor_count'
  
  if (countCache !== null && (now - (cacheTimestamps[cacheKey] || 0)) < CACHE_TTL) {
    return countCache
  }
  
  const count = await env.EARLY_ACCESS.get('total_count')
  const parsedCount = count ? parseInt(count, 10) : 0
  
  countCache = parsedCount
  cacheTimestamps[cacheKey] = now
  
  return parsedCount
}

async function incrementVisitorCount(env) {
  const current = await getVisitorCount(env)
  const newCount = current + 1
  
  await env.EARLY_ACCESS.put('total_count', newCount.toString())
  
  countCache = newCount
  cacheTimestamps.visitor_count = Date.now()
  
  return newCount
}

// Progress with caching
async function getProgress(env) {
  const now = Date.now()
  const cacheKey = 'progress'
  
  if (progressCache !== null && (now - (cacheTimestamps[cacheKey] || 0)) < CACHE_TTL) {
    return progressCache
  }
  
  const progress = await env.KRYPT_DATA.get('development_progress')
  const parsedProgress = progress ? JSON.parse(progress) : getDefaultProgress()
  
  progressCache = parsedProgress
  cacheTimestamps[cacheKey] = now
  
  return parsedProgress
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

// Logs with caching
async function getLogs(env) {
  const now = Date.now()
  const cacheKey = 'logs'
  
  if (logsCache !== null && (now - (cacheTimestamps[cacheKey] || 0)) < CACHE_TTL) {
    return logsCache
  }
  
  const logs = await env.KRYPT_DATA.get('development_logs')
  const parsedLogs = logs ? JSON.parse(logs) : []
  
  logsCache = parsedLogs
  cacheTimestamps[cacheKey] = now
  
  return parsedLogs
}

// Bot detection
function isBot(userAgent) {
  if (!userAgent) return true
  
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
    /baiduspider/i, /yandexbot/i, /facebookexternalhit/i,
    /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegram/i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}