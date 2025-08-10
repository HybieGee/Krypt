import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  id: string
  walletAddress?: string
  balance?: number
  credits: number
  raffleTickets: number
  isEarlyAccess: boolean
  joinedAt: Date
  isMining?: boolean
  stakedAmount?: number
  stakeStartDate?: Date
  stakeDuration?: number
}

interface TerminalLog {
  id: string
  timestamp: Date
  type: 'code' | 'commit' | 'phase' | 'system'
  message: string
  details?: any
}

interface BlockchainProgress {
  currentPhase: number
  phaseProgress: number
  totalComponents: number
  completedComponents: number
  estimatedCompletion: Date
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
  toggleMining: () => void
  setStaking: (amount: number, duration: number) => void
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
          }
        })),
        toggleMining: () => set((state) => ({
          user: state.user ? { ...state.user, isMining: !state.user.isMining } : null
        })),
        setStaking: (amount, duration) => set((state) => ({
          user: state.user ? { 
            ...state.user, 
            stakedAmount: (state.user.stakedAmount || 0) + amount,
            stakeStartDate: new Date(),
            stakeDuration: duration
          } : null
        })),
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