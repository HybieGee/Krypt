import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface StakeEntry {
  id: string
  amount: number
  startDate: Date
  duration: number
  dailyReturn: number
}

interface User {
  id: string
  walletAddress?: string
  balance?: number
  credits: number
  raffleTickets: number
  isEarlyAccess: boolean
  joinedAt: Date
  isMining?: boolean
  stakes: StakeEntry[]
  mintedAmount?: number
}

interface TerminalLog {
  id: string
  timestamp: Date
  type: 'code' | 'commit' | 'phase' | 'system' | 'api' | 'warning' | 'test' | 'github'
  message: string
  details?: any
}

interface BlockchainProgress {
  currentPhase: number
  phaseProgress: number
  totalComponents: number
  completedComponents: number
  estimatedCompletion: Date
  linesOfCode?: number
  commits?: number
  testsRun?: number
}

interface Statistics {
  totalUsers: number
  earlyAccessUsers: number
  linesOfCode: number
  githubCommits: number
  testsRun: number
}

interface StoreState {
  user: User | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  terminalLogs: TerminalLog[]
  chatMessages: any[]
  blockchainProgress: BlockchainProgress
  statistics: Statistics
  
  setUser: (user: User | null) => void
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void
  addTerminalLog: (log: TerminalLog) => void
  addChatMessage: (message: any) => void
  updateBlockchainProgress: (progress: Partial<BlockchainProgress>) => void
  updateStatistics: (stats: Partial<Statistics>) => void
  clearChatMessages: () => void
  updateUserWallet: (walletAddress: string, balance: number) => void
  updateUserMintedAmount: (amount: number) => void
  toggleMining: () => void
  addStake: (amount: number, duration: number, dailyReturn?: number) => void
  setProgress: (progress: any) => void
  addLogs: (logs: any[]) => void
  setStats: (stats: any) => void
  resetAllData: () => void
}

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        connectionStatus: 'disconnected',
        terminalLogs: [],
        chatMessages: [],
        blockchainProgress: {
          currentPhase: 1,
          phaseProgress: 0,
          totalComponents: 1000,
          completedComponents: 0,
          estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        statistics: {
          totalUsers: 0,
          earlyAccessUsers: 0,
          linesOfCode: 0,
          githubCommits: 0,
          testsRun: 0,
        },

        setUser: (user) => set({ user }),
        setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
        addTerminalLog: (log) => set((state) => ({
          terminalLogs: [...state.terminalLogs.slice(-999), log],
        })),
        addChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),
        updateBlockchainProgress: (progress) => set((state) => ({
          blockchainProgress: { ...state.blockchainProgress, ...progress },
        })),
        updateStatistics: (stats) => set((state) => ({
          statistics: { ...state.statistics, ...stats },
        })),
        clearChatMessages: () => set({ chatMessages: [] }),
        updateUserWallet: (walletAddress, balance) => set((state) => ({
          user: state.user ? { ...state.user, walletAddress, balance } : {
            id: Math.random().toString(36).substring(7),
            walletAddress,
            balance,
            credits: 0,
            raffleTickets: 0,
            isEarlyAccess: true,
            joinedAt: new Date(),
            mintedAmount: 0,
            stakes: [],
          }
        })),
        updateUserMintedAmount: (amount) => set((state) => ({
          user: state.user ? { ...state.user, mintedAmount: (state.user.mintedAmount || 0) + amount } : null
        })),
        toggleMining: () => set((state) => ({
          user: state.user ? { ...state.user, isMining: !state.user.isMining } : null
        })),
        addStake: (amount, duration, dailyReturn) => set((state) => ({
          user: state.user ? { 
            ...state.user, 
            stakes: [
              ...(state.user.stakes || []),
              {
                id: Math.random().toString(36).substring(7),
                amount,
                startDate: new Date(),
                duration,
                dailyReturn: dailyReturn ?? amount * 0.005 // Default to 0.5% if not provided
              }
            ]
          } : null
        })),
        setProgress: (progress) => set((state) => {
          // Only update if values have actually changed and are valid
          const currentProgress = state.blockchainProgress
          
          // Ensure we never go backwards in progress (prevents flickering)
          const newProgress = {
            currentPhase: Math.max(progress.currentPhase ?? currentProgress.currentPhase ?? 1, currentProgress.currentPhase ?? 1),
            phaseProgress: Math.max(progress.phaseProgress ?? currentProgress.phaseProgress ?? 0, currentProgress.phaseProgress ?? 0),
            totalComponents: progress.totalComponents ?? currentProgress.totalComponents,
            completedComponents: Math.max(progress.componentsCompleted ?? currentProgress.completedComponents ?? 0, currentProgress.completedComponents ?? 0),
            linesOfCode: Math.max(progress.linesOfCode ?? currentProgress.linesOfCode ?? 0, currentProgress.linesOfCode ?? 0),
            commits: Math.max(progress.commits ?? currentProgress.commits ?? 0, currentProgress.commits ?? 0),
            testsRun: Math.max(progress.testsRun ?? currentProgress.testsRun ?? 0, currentProgress.testsRun ?? 0),
            estimatedCompletion: currentProgress.estimatedCompletion
          }
          
          // Check if any values actually changed
          const hasChanged = Object.keys(newProgress).some((key) => {
            const typedKey = key as keyof typeof newProgress
            return newProgress[typedKey] !== currentProgress[typedKey]
          })
          
          if (!hasChanged) {
            return state // No changes, don't trigger re-render
          }
          
          return {
            blockchainProgress: newProgress
          }
        }),
        addLogs: (logs) => set((state) => {
          // Create a map of existing logs by ID for efficient lookup
          const existingLogsMap = new Map(state.terminalLogs.map(log => [log.id, log]))
          
          // Process new logs and only add if they don't exist
          const newLogs = logs.filter(log => !existingLogsMap.has(log.id))
            .map(log => ({
              id: log.id || Math.random().toString(36).substring(7),
              timestamp: new Date(log.timestamp),
              type: log.type,
              message: log.message,
              details: log.details
            }))
          
          // Merge existing logs with new logs, maintaining chronological order (oldest first)
          const allLogs = [...state.terminalLogs, ...newLogs]
          
          // Sort by timestamp to ensure proper chronological order
          const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          
          // Keep all logs for lifelong history
          return {
            terminalLogs: sortedLogs
          }
        }),
        setStats: (stats) => set((state) => {
          const currentStats = state.statistics
          
          // Apply monotonic updates to prevent statistics from going backwards
          return {
            statistics: {
              totalUsers: Math.max(stats.total_users?.value || 0, currentStats.totalUsers || 0),
              earlyAccessUsers: Math.max(stats.early_access_users?.value || 0, currentStats.earlyAccessUsers || 0),
              linesOfCode: Math.max(stats.total_lines_of_code?.value || 0, currentStats.linesOfCode || 0),
              githubCommits: Math.max(stats.total_commits?.value || 0, currentStats.githubCommits || 0),
              testsRun: Math.max(stats.total_tests_run?.value || 0, currentStats.testsRun || 0),
            }
          }
        }),
        resetAllData: () => set(() => {
          // Clear all possible storage locations
          localStorage.removeItem('krypt-terminal-storage')
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear cookies
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
          
          // Reset to initial state
          return {
            user: null,
            connectionStatus: 'disconnected',
            terminalLogs: [],
            chatMessages: [],
            blockchainProgress: {
              currentPhase: 1,
              phaseProgress: 0,
              totalComponents: 4500,
              completedComponents: 0,
              estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
            statistics: {
              totalUsers: 0,
              earlyAccessUsers: 0,
              linesOfCode: 0,
              githubCommits: 0,
              testsRun: 0,
            },
          }
        }),
      }),
      {
        name: 'krypt-terminal-storage',
        partialize: (state) => ({
          user: state.user,
          chatMessages: state.chatMessages,
        }),
      }
    )
  )
)