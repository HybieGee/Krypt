import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from '../../lib/redis'

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
    // Try to get cached count first
    let count = await redis.get('early_access:count')
    
    if (count === null) {
      // Fallback to counting set members if cache is missing
      count = await redis.scard('early_access:uids')
      
      // Update cache
      await redis.set('early_access:count', count.toString())
    }

    return res.json({ 
      count: typeof count === 'string' ? parseInt(count) : count 
    })
    
  } catch (error) {
    console.error('Count retrieval error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}