const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin + '/api'

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
    const response = await fetch(`${API_BASE_URL}/progress`)
    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`)
    }
    return response.json()
  }

  async getLogs(limit: number = 50): Promise<LogEntry[]> {
    const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`)
    }
    return response.json()
  }

  async getStats(): Promise<StatsData> {
    const response = await fetch(`${API_BASE_URL}/stats`)
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`)
    }
    return response.json()
  }

  async trackSession(sessionId: string, walletAddress?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/session`, {
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
    const response = await fetch(`${API_BASE_URL}/typing`)
    if (!response.ok) {
      throw new Error(`Failed to fetch typing: ${response.statusText}`)
    }
    return response.json()
  }

  async updateUserBalance(walletAddress: string, balance: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/balance`, {
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
    const response = await fetch(`${API_BASE_URL}/leaderboard`)
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
    }
    return response.json()
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

    // Poll every 5 seconds for live statistics
    this.pollInterval = setInterval(poll, 5000)
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