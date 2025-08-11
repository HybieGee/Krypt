// Comprehensive Cloudflare Worker for Krypt Terminal
// Handles: Visitor Tracking, Development Progress, Logs, Leaderboard, User Balances

// In-memory caches for immediate consistency
let countCache = null
let progressCache = null
let logsCache = null
let leaderboardCache = null
let cacheTimestamps = {}
const CACHE_TTL = 10000 // 10 seconds

// Development configuration
const BLOCKCHAIN_COMPONENTS = 4500
const DEVELOPMENT_INTERVAL = 15000 // 15 seconds between components

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
      return handleProgress(env, corsHeaders)
    }
    if (url.pathname === '/api/progress/reset' && request.method === 'POST') {
      return handleProgressReset(request, env, corsHeaders)
    }
    
    // Master Reset for Launch
    if (url.pathname === '/api/admin/reset-all' && request.method === 'POST') {
      return handleMasterReset(request, env, corsHeaders)
    }

    // Development Logs Routes
    if (url.pathname.startsWith('/api/logs')) {
      return handleLogs(request, env, corsHeaders)
    }

    // Statistics Routes
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(env, corsHeaders)
    }

    // User Balance Routes
    if (url.pathname === '/api/user/balance' && request.method === 'POST') {
      return handleUpdateBalance(request, env, corsHeaders)
    }

    // Leaderboard Routes
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return handleLeaderboard(env, corsHeaders)
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

// ===== MASTER RESET FOR LAUNCH =====
async function handleMasterReset(request, env, corsHeaders) {
  try {
    const { adminKey, resetVisitors = false } = await request.json().catch(() => ({}))
    
    // Verify admin key
    if (adminKey !== 'krypt_master_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset development progress to initial state
    const resetProgress = getDefaultProgress()
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(resetProgress))
    
    // Clear development logs
    await env.KRYPT_DATA.put('development_logs', JSON.stringify([]))
    
    // Clear all user balances (optional)
    // This would need to iterate through all user keys
    
    // Reset visitor count if requested
    if (resetVisitors) {
      await env.EARLY_ACCESS.put('total_count', '0')
      // Optionally clear all visitor records
      // const keys = await env.EARLY_ACCESS.list()
      // for (const key of keys.keys) {
      //   if (key.name.startsWith('visitor:') || key.name.startsWith('fingerprint:')) {
      //     await env.EARLY_ACCESS.delete(key.name)
      //   }
      // }
    }
    
    // Clear all caches
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

// ===== DEVELOPMENT PROGRESS =====
async function handleProgress(env, corsHeaders) {
  try {
    const progress = await getProgress(env)
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

async function handleProgressReset(request, env, corsHeaders) {
  try {
    // Optional: Add authentication here
    const { adminKey } = await request.json().catch(() => ({}))
    
    // Simple admin key check (you can make this more secure)
    if (adminKey !== 'krypt_admin_reset_2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset progress to initial state
    const resetProgress = getDefaultProgress()
    await env.KRYPT_DATA.put('development_progress', JSON.stringify(resetProgress))
    
    // Clear logs
    await env.KRYPT_DATA.put('development_logs', JSON.stringify([]))
    
    // Clear caches
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

// ===== DEVELOPMENT LOGS =====
async function handleLogs(request, env, corsHeaders) {
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

// ===== LEADERBOARD =====
async function handleLeaderboard(env, corsHeaders) {
  try {
    const leaderboard = await getLeaderboard(env)
    return new Response(JSON.stringify(leaderboard), {
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

// Leaderboard with caching
async function getLeaderboard(env) {
  const now = Date.now()
  const cacheKey = 'leaderboard'
  
  if (leaderboardCache !== null && (now - (cacheTimestamps[cacheKey] || 0)) < CACHE_TTL) {
    return leaderboardCache
  }
  
  // This is a simplified version - you can enhance it to fetch all user balances
  const leaderboard = []
  leaderboardCache = leaderboard
  cacheTimestamps[cacheKey] = now
  
  return leaderboard
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