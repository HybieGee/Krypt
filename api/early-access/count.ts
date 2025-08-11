import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, isRedisAvailable } from '../../lib/redis'

// In-memory fallback when Redis is not available
let fallbackCount = 0

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    let count: number = 0
    
    if (isRedisAvailable() && redis) {
      try {
        // Try to get cached count first
        let redisCount = await redis.get('early_access:count')
        
        if (redisCount === null) {
          // Fallback to counting set members if cache is missing
          redisCount = await redis.scard('early_access:uids')
          
          // Update cache
          await redis.set('early_access:count', redisCount.toString())
        }

        count = typeof redisCount === 'string' ? parseInt(redisCount) : redisCount
      } catch (error) {
        console.error('Redis error, using fallback count:', error)
        count = fallbackCount
      }
    } else {
      console.log('Redis not available, using fallback count')
      count = fallbackCount
    }

    return res.json({ count })
    
  } catch (error) {
    console.error('Count retrieval error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}