import { Pool } from 'pg'
import { logger } from '../utils/logger'
import * as fs from 'fs'
import * as path from 'path'

let pool: Pool | null = null

export const getPool = (): Pool => {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'krypt_terminal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

    pool = new Pool(config)

    pool.on('error', (err) => {
      logger.error('Unexpected database error:', err)
    })

    pool.on('connect', () => {
      logger.info('New database connection established')
    })
  }

  return pool
}

export const initializeDatabase = async () => {
  try {
    if (process.env.USE_MOCK_DATA === 'true') {
      logger.info('Using mock database for development')
      return
    }
    
    const dbPool = getPool()
    
    await dbPool.query('SELECT NOW()')
    logger.info('Database connection successful')
    
    const schemaPath = path.join(__dirname, '../models/schema.sql')
    if (fs.existsSync(schemaPath) && process.env.RUN_MIGRATIONS === 'true') {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      await dbPool.query(schema)
      logger.info('Database schema initialized')
    }
    
  } catch (error) {
    logger.error('Database initialization failed:', error)
    throw error
  }
}

export const query = async (text: string, params?: any[]) => {
  const dbPool = getPool()
  const start = Date.now()
  const res = await dbPool.query(text, params)
  const duration = Date.now() - start
  logger.debug('Executed query', { text, duration, rows: res.rowCount })
  return res
}

export const getClient = async () => {
  const dbPool = getPool()
  const client = await dbPool.connect()
  const release = client.release.bind(client)
  
  const timeout = setTimeout(() => {
    logger.error('Client has been checked out for more than 5 seconds!')
    logger.error(new Error().stack)
  }, 5000)
  
  client.release = () => {
    clearTimeout(timeout)
    return release()
  }
  
  return client
}

export const closeDatabase = async () => {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('Database connections closed')
  }
}