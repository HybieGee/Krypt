import { Pool } from 'pg'
import { logger } from './logger'

let pool: Pool | null = null

// Use Vercel Postgres or external database
export const getPool = (): Pool => {
  if (!pool) {
    const config = {
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

    pool = new Pool(config)

    pool.on('error', (err) => {
      logger.error('Database pool error:', err)
    })
  }

  return pool
}

export const initializeDatabase = async () => {
  try {
    const dbPool = getPool()
    
    // Test connection
    await dbPool.query('SELECT NOW()')
    logger.info('Database connected successfully')
    
    // Initialize schema if needed
    if (process.env.RUN_MIGRATIONS === 'true') {
      await initializeSchema()
    }
    
  } catch (error) {
    logger.error('Database initialization failed:', error)
    // Don't throw in production - allow app to run with limited functionality
    if (process.env.NODE_ENV !== 'production') {
      throw error
    }
  }
}

async function initializeSchema() {
  const dbPool = getPool()
  
  try {
    // Create tables if they don't exist
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) UNIQUE,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50),
        balance DECIMAL(18, 8) DEFAULT 0,
        is_mining BOOLEAN DEFAULT false,
        raffle_tickets INTEGER DEFAULT 0,
        credits INTEGER DEFAULT 0,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        is_early_access BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS blockchain_progress (
        id SERIAL PRIMARY KEY,
        phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 4),
        component_number INTEGER NOT NULL CHECK (component_number >= 1 AND component_number <= 640),
        component_name VARCHAR(255) NOT NULL,
        description TEXT,
        code_snippet TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        lines_of_code INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(component_number)
      )
    `)
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS development_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        component_id INTEGER,
        action_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS global_stats (
        id SERIAL PRIMARY KEY,
        stat_name VARCHAR(50) UNIQUE NOT NULL,
        stat_value BIGINT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS terminal_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Initialize global stats
    await dbPool.query(`
      INSERT INTO global_stats (stat_name, stat_value) VALUES
        ('total_users', 0),
        ('early_access_users', 0),
        ('total_lines_of_code', 0),
        ('total_commits', 0),
        ('total_tests_run', 0),
        ('components_completed', 0),
        ('current_phase', 1),
        ('total_messages_sent', 0)
      ON CONFLICT (stat_name) DO NOTHING
    `)
    
    logger.info('Database schema initialized')
    
  } catch (error) {
    logger.error('Schema initialization failed:', error)
  }
}

export const query = async (text: string, params?: any[]) => {
  const dbPool = getPool()
  try {
    const res = await dbPool.query(text, params)
    return res
  } catch (error) {
    logger.error('Query failed:', { text, error })
    throw error
  }
}

export const closeDatabase = async () => {
  if (pool) {
    await pool.end()
    pool = null
  }
}