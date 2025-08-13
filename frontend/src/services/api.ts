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

  async updateUserBalance(walletAddress: string, balance: number, mintedAmount?: number): Promise<any> {
    const payload: any = { walletAddress, balance }
    if (mintedAmount !== undefined) {
      payload.mintedAmount = mintedAmount
    }
    
    const response = await fetch(`${API_BASE_URL}/user/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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

  async registerEarlyAccessUser(visitorId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/early-access`, {
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

  async getUserMilestones(walletAddress: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/user/milestones?walletAddress=${walletAddress}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user milestones: ${response.statusText}`)
    }
    return response.json()
  }

  async getRaffleEntries(walletAddress: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/user/raffle-entries?walletAddress=${walletAddress}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch raffle entries: ${response.statusText}`)
    }
    return response.json()
  }

  async enterRaffle(walletAddress: string, raffleType: string, ticketCost: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/raffle/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, raffleType, ticketCost })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to enter raffle: ${response.statusText}`)
    }
    return response.json()
  }

  async checkNuclearReset(): Promise<{ shouldReset: boolean, resetId: string }> {
    const response = await fetch(`${API_BASE_URL}/nuclear-reset-check`)
    if (!response.ok) {
      throw new Error(`Failed to check nuclear reset: ${response.statusText}`)
    }
    return response.json()
  }

  async getWalletByFingerprint(fingerprint: string): Promise<{ address: string; balance: number; mintedAmount: number } | null> {
    const response = await fetch(`${API_BASE_URL}/wallet/fingerprint/${fingerprint}`)
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`Failed to get wallet by fingerprint: ${response.statusText}`)
    }
    return response.json()
  }

  async registerWalletFingerprint(walletAddress: string, fingerprint: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet/fingerprint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, fingerprint })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to register wallet fingerprint: ${response.statusText}`)
    }
    return response.json()
  }

  async triggerDevelopmentTick(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/development/tick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) {
      throw new Error(`Failed to trigger development tick: ${response.statusText}`)
    }
    return response.json()
  }

  startPolling(
    onProgress: (progress: ProgressData) => void,
    onLogs: (logs: LogEntry[]) => void,
    onStats: (stats: StatsData) => void
  ) {
    if (this.isPolling) return

    this.isPolling = true
    
    const poll = async () => {
      // First trigger development tick for real-time component generation
      try {
        await this.triggerDevelopmentTick()
      } catch (error) {
        console.error('Development tick error:', error)
      }
      
      // Then fetch all data
      let progress, logs, stats
      
      try {
        progress = await this.getProgress()
        onProgress(progress)
      } catch (error) {
        console.error('Progress polling error:', error)
      }
      
      try {
        logs = await this.getLogs(100)
        onLogs(logs)
      } catch (error) {
        console.error('Logs polling error:', error)
      }
      
      try {
        stats = await this.getStats()
        onStats(stats)
      } catch (error) {
        console.error('Stats polling error:', error)
      }
    }

    // Initial fetch
    poll()

    // Poll every 15 seconds for REAL 15-second component generation
    this.pollInterval = setInterval(poll, 15000)
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