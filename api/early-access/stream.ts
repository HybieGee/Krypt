import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, isRedisAvailable } from '../../lib/redis'

// In-memory fallback when Redis is not available
let fallbackCount = 0

// Note: SSE with Redis pub/sub is complex in serverless edge functions
// We'll implement a simpler approach that works well with Vercel

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

  try {
    let currentCount = 0
    
    // Get initial count
    if (isRedisAvailable() && redis) {
      try {
        let count = await redis.get('early_access:count')
        
        if (count === null) {
          count = await redis.scard('early_access:uids')
          await redis.set('early_access:count', count.toString())
        }

        currentCount = typeof count === 'string' ? parseInt(count) : count
      } catch (error) {
        console.error('Redis error in stream, using fallback:', error)
        currentCount = fallbackCount
      }
    } else {
      console.log('Redis not available, using fallback count for stream')
      currentCount = fallbackCount
    }

    // Send current count immediately
    res.write(`data: ${JSON.stringify({ count: currentCount })}\n\n`)

    // For Vercel Edge Functions, we'll implement polling instead of pub/sub
    // as pub/sub requires persistent connections which aren't ideal for serverless
    let lastCount = currentCount
    
    const pollInterval = setInterval(async () => {
      try {
        let newCount = 0
        
        if (isRedisAvailable() && redis) {
          try {
            let count = await redis.get('early_access:count')
            
            if (count === null) {
              count = await redis.scard('early_access:uids')
            }
            
            newCount = typeof count === 'string' ? parseInt(count) : count
          } catch (error) {
            console.error('Redis error in stream polling:', error)
            newCount = fallbackCount
          }
        } else {
          newCount = fallbackCount
        }
        
        if (newCount !== lastCount) {
          res.write(`data: ${JSON.stringify({ count: newCount })}\n\n`)
          lastCount = newCount
        }
      } catch (error) {
        console.error('SSE polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval)
    })

    req.on('end', () => {
      clearInterval(pollInterval)
    })

  } catch (error) {
    console.error('SSE stream error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}