import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from '../../lib/redis'
import crypto from 'crypto'
import isbot from 'isbot'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const userAgent = req.headers['user-agent'] || ''
    const acceptLanguage = req.headers['accept-language'] || ''
    const forwarded = req.headers['x-forwarded-for'] as string
    const ip = forwarded ? forwarded.split(',')[0] : req.headers['x-real-ip'] || 'unknown'
    
    // Skip bots
    if (isbot(userAgent)) {
      const count = await redis.get('early_access:count') || '0'
      return res.json({ count: parseInt(count) })
    }

    // Skip local/preview hosts  
    const host = req.headers.host || ''
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.local')) {
      const count = await redis.get('early_access:count') || '0'
      return res.json({ count: parseInt(count) })
    }

    // Get or create unique ID from cookies header
    const cookies = req.headers.cookie || ''
    const cookieMatch = cookies.match(/ea_uid=([^;]+)/)
    let uid = cookieMatch ? cookieMatch[1] : null
    
    if (!uid) {
      // Create fingerprint for users who clear cookies
      const fingerprint = crypto
        .createHash('sha256')
        .update(`${ip}:${userAgent}:${acceptLanguage}`)
        .digest('hex')
      
      // Check if we've seen this fingerprint recently (48h)
      const existingUid = await redis.get(`early_access:fingerprint:${fingerprint}`)
      
      if (existingUid) {
        uid = existingUid as string
      } else {
        // Generate new UID
        uid = crypto.randomUUID()
        
        // Store fingerprint mapping (48h TTL)
        await redis.setex(`early_access:fingerprint:${fingerprint}`, 48 * 60 * 60, uid)
      }
      
      // Set httpOnly cookie (7 days)
      res.setHeader('Set-Cookie', [
        `ea_uid=${uid}; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      ])
    }

    // Add to Redis set - returns 1 if new, 0 if already exists
    const isNewVisitor = await redis.sadd('early_access:uids', uid)
    
    let count: number
    
    if (isNewVisitor === 1) {
      // New unique visitor - update count and publish
      count = await redis.scard('early_access:uids')
      await redis.set('early_access:count', count.toString())
      
      // Publish update to subscribers
      await redis.publish('early_access:events', JSON.stringify({ count }))
      
      console.log(`New unique visitor: ${uid.substring(0, 8)}... Total: ${count}`)
    } else {
      // Returning visitor - just get current count
      const storedCount = await redis.get('early_access:count')
      count = storedCount ? parseInt(storedCount) : await redis.scard('early_access:uids')
    }

    return res.json({ count })
    
  } catch (error) {
    console.error('Visit tracking error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}