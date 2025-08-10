import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  id: string
  walletAddress?: string
  credits: number
  raffleTickets: number
  isEarlyAccess: boolean
  joinedAt: Date
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
          totalComponents: 640,
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