// Separate endpoints for different data sources
const CLOUDFLARE_API_URL = window.location.origin + '/api' // For progress, visitor count, stats
const VERCEL_API_URL = 'https://crypto-ai-ten.vercel.app/api' // For logs, development activity

export interface ProgressData {
  currentPhase: number
  componentsCompleted: number
  totalComponents: number
  percentComplete: number
  linesOfCode: number
  commits: number
  testsRun: number
}

export interface LogEntry {
  id: string
  timestamp: string
  type: 'code' | 'commit' | 'test' | 'phase' | 'system' | 'github' | 'api' | 'warning'
  message: string
  details?: any
}

export interface StatsData {
  total_users: { value: number; lastUpdated: string }
  early_access_users: { value: number; lastUpdated: string }
  total_lines_of_code: { value: number; lastUpdated: string }
  total_commits: { value: number; lastUpdated: string }
  total_tests_run: { value: number; lastUpdated: string }
  components_completed: { value: number; lastUpdated: string }
  current_phase: { value: number; lastUpdated: string }
}

class ApiService {
  private static instance: ApiService
  private isPolling: boolean = false
  private pollInterval: NodeJS.Timeout | null = null

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  async getProgress(): Promise<ProgressData> {
    const response = await fetch(`${CLOUDFLARE_API_URL}/progress`)
    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`)
    }
    return response.json()
  }

  async getLogs(limit: number = 50): Promise<LogEntry[]> {
    const response = await fetch(`${VERCEL_API_URL}/logs?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`)
    }
    return response.json()
  }

  async getStats(): Promise<StatsData> {
    const response = await fetch(`${CLOUDFLARE_API_URL}/stats`)
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`)
    }
    return response.json()
  }

  async trackSession(sessionId: string, walletAddress?: string): Promise<any> {
    const response = await fetch(`${VERCEL_API_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId, walletAddress })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to track session: ${response.statusText}`)
    }
    return response.json()
  }

  async getTyping(): Promise<{ text: string; isActive: boolean; currentComponent: number; phase: number }> {
    const response = await fetch(`${VERCEL_API_URL}/typing`)
    if (!response.ok) {
      throw new Error(`Failed to fetch typing: ${response.statusText}`)
    }
    return response.json()
  }

  async updateUserBalance(walletAddress: string, balance: number): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_API_URL}/user/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, balance })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update balance: ${response.statusText}`)
    }
    return response.json()
  }

  async getLeaderboard(): Promise<Array<{ address: string; balance: number }>> {
    const response = await fetch(`${CLOUDFLARE_API_URL}/leaderboard`)
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
    }
    return response.json()
  }

  async registerEarlyAccessUser(visitorId: string): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_API_URL}/early-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ visitorId })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to register early access user: ${response.statusText}`)
    }
    const result = await response.json()
    
    // Trigger immediate stats refresh after registration
    try {
      const stats = await this.getStats()
      // Dispatch a custom event to trigger immediate UI update
      window.dispatchEvent(new CustomEvent('early-access-registered', { 
        detail: { stats, registrationResult: result }
      }))
    } catch (error) {
      console.warn('Failed to refresh stats after registration:', error)
    }
    
    return result
  }

  startPolling(
    onProgress: (progress: ProgressData) => void,
    onLogs: (logs: LogEntry[]) => void,
    onStats: (stats: StatsData) => void,
    onError: (error: Error) => void
  ) {
    if (this.isPolling) return

    this.isPolling = true
    
    const poll = async () => {
      try {
        const [progress, logs, stats] = await Promise.all([
          this.getProgress(),
          this.getLogs(20), // Get last 20 logs
          this.getStats()
        ])
        
        onProgress(progress)
        onLogs(logs)
        onStats(stats)
      } catch (error) {
        console.error('Polling error:', error)
        onError(error as Error)
      }
    }

    // Initial fetch
    poll()

    // Poll every 1 second for very frequent stats updates (wallet-based tracking)
    this.pollInterval = setInterval(poll, 1000)
  }

  stopPolling() {
    this.isPolling = false
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }
}

export default ApiService