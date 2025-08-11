// Cloudflare Worker for Early Access Visitor Tracking
// Enhanced with in-memory caching for immediate consistency

// In-memory cache to bypass KV eventual consistency
let countCache = null
let cacheTimestamp = 0
const CACHE_TTL = 10000 // 10 seconds

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Route: POST /visit - Register a visitor
    if (url.pathname === '/api/early-access/visit' && request.method === 'POST') {
      return handleVisit(request, env, corsHeaders)
    }

    // Route: GET /count - Get current visitor count  
    if (url.pathname === '/api/early-access/count' && request.method === 'GET') {
      return handleCount(env, corsHeaders)
    }

    // Route: GET /stream - Server-sent events for real-time updates
    if (url.pathname === '/api/early-access/stream' && request.method === 'GET') {
      return handleStream(env, corsHeaders)
    }

    // Default response
    return new Response('Early Access Visitor Tracker', { 
      status: 404,
      headers: corsHeaders 
    })
  }
}

// Handle visitor registration
async function handleVisit(request, env, corsHeaders) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = request.headers.get('User-Agent') || ''
    const country = request.cf?.country || 'unknown'
    
    // Skip bots
    if (isBot(userAgent)) {
      const count = await getVisitorCount(env)
      return new Response(JSON.stringify({ count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get or create visitor ID from cookie
    const cookies = request.headers.get('Cookie') || ''
    const cookieMatch = cookies.match(/ea_uid=([^;]+)/)
    let visitorId = cookieMatch ? cookieMatch[1] : null

    if (!visitorId) {
      // Generate new visitor ID
      visitorId = crypto.randomUUID()
    }

    // Create unique key combining multiple factors
    const visitorKey = `visitor:${visitorId}`
    const fingerprint = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(`${ip}:${userAgent}:${country}`)
    )
    const fingerprintHex = Array.from(new Uint8Array(fingerprint))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    
    const fingerprintKey = `fingerprint:${fingerprintHex}`

    // Check if this is a new visitor
    const [existingVisitor, existingFingerprint] = await Promise.all([
      env.EARLY_ACCESS.get(visitorKey),
      env.EARLY_ACCESS.get(fingerprintKey)
    ])

    let count
    const now = Date.now()

    if (!existingVisitor && !existingFingerprint) {
      // Completely new visitor
      await Promise.all([
        env.EARLY_ACCESS.put(visitorKey, now.toString()),
        env.EARLY_ACCESS.put(fingerprintKey, visitorId, { expirationTtl: 172800 }) // 48 hours
      ])
      
      // Increment counter with immediate cache update
      count = await incrementVisitorCountFast(env)
      console.log(`New visitor: ${visitorId.substring(0, 8)}... Total: ${count}`)
    } else {
      // Returning visitor
      count = await getVisitorCount(env)
    }

    // Set cookie for 7 days
    const response = new Response(JSON.stringify({ count }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': `ea_uid=${visitorId}; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      }
    })

    return response

  } catch (error) {
    console.error('Visit tracking error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', count: 0 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Handle count requests with cache
async function handleCount(env, corsHeaders) {
  try {
    const count = await getVisitorCount(env)
    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Count error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', count: 0 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Handle server-sent events for real-time updates
async function handleStream(env, corsHeaders) {
  try {
    const count = await getVisitorCount(env)
    
    // Simple SSE response with current count
    const stream = new ReadableStream({
      start(controller) {
        // Send current count immediately
        controller.enqueue(`data: ${JSON.stringify({ count })}\n\n`)
        
        // For now, just send the current count
        // In a production system, you'd set up a pub/sub mechanism
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
    console.error('Stream error:', error)
    return new Response('error: Internal server error\n\n', {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream'
      }
    })
  }
}

// Get current visitor count from KV with in-memory caching
async function getVisitorCount(env) {
  const now = Date.now()
  
  // Return cached value if it's fresh (within 10 seconds)
  if (countCache !== null && (now - cacheTimestamp) < CACHE_TTL) {
    return countCache
  }
  
  // Fetch from KV and update cache
  const count = await env.EARLY_ACCESS.get('total_count')
  const parsedCount = count ? parseInt(count, 10) : 0
  
  // Update cache
  countCache = parsedCount
  cacheTimestamp = now
  
  return parsedCount
}

// Increment visitor count with immediate cache update
async function incrementVisitorCountFast(env) {
  const current = await getVisitorCount(env)
  const newCount = current + 1
  
  // Update KV storage
  await env.EARLY_ACCESS.put('total_count', newCount.toString())
  
  // IMMEDIATELY update in-memory cache for instant consistency
  countCache = newCount
  cacheTimestamp = Date.now()
  
  return newCount
}

// Simple bot detection
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