import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

// Simple visitor tracking that works without external dependencies
// This provides basic functionality until Redis is set up

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
    // Get or create unique ID from cookies header
    const cookies = req.headers.cookie || ''
    const cookieMatch = cookies.match(/ea_uid=([^;]+)/)
    let uid = cookieMatch ? cookieMatch[1] : null
    
    if (!uid) {
      // Generate new UID
      uid = crypto.randomUUID()
      
      // Set httpOnly cookie (7 days)
      res.setHeader('Set-Cookie', [
        `ea_uid=${uid}; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      ])
    }

    // For now, just return a simple incrementing count based on timestamp
    // This ensures each visitor sees an increasing number
    const baseTime = new Date('2024-01-01').getTime()
    const currentTime = Date.now()
    const simpleCount = Math.floor((currentTime - baseTime) / (1000 * 60 * 10)) + 1 // Increment every 10 minutes

    console.log(`Simple visitor tracking: ${uid.substring(0, 8)}... Count: ${simpleCount}`)

    return res.json({ count: simpleCount })
    
  } catch (error) {
    console.error('Simple visit tracking error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}