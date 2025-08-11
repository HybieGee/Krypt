export interface User {
  id: string
  wallet_address?: string
  session_id: string
  username?: string
  balance: number
  is_mining: boolean
  raffle_tickets: number
  credits: number
  first_seen: Date
  last_active: Date
  total_messages: number
  is_early_access: boolean
  created_at: Date
  updated_at: Date
}

export interface ChatSession {
  id: string
  user_id: string
  session_start: Date
  session_end?: Date
  messages_count: number
  created_at: Date
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  tokens_used: number
  created_at: Date
}

export interface BlockchainProgress {
  id: number
  phase: number
  component_number: number
  component_name: string
  description?: string
  code_snippet?: string
  status: 'pending' | 'in_progress' | 'completed'
  started_at?: Date
  completed_at?: Date
  lines_of_code: number
  created_at: Date
}

export interface DevelopmentLog {
  id: string
  component_id?: number
  action_type: 'code_written' | 'test_run' | 'commit' | 'phase_complete'
  description: string
  details?: any
  timestamp: Date
}

export interface GlobalStats {
  id: number
  stat_name: string
  stat_value: number
  last_updated: Date
}

export interface RaffleEntry {
  id: string
  user_id: string
  raffle_round: number
  ticket_count: number
  entry_time: Date
  is_winner: boolean
}

export interface RaffleRound {
  id: number
  round_number: number
  milestone_name?: string
  total_tickets: number
  winner_user_id?: string
  prize_amount?: number
  started_at: Date
  ended_at?: Date
  status: 'active' | 'completed' | 'cancelled'
}

export interface Airdrop {
  id: string
  airdrop_name: string
  total_recipients: number
  total_amount: number
  amount_per_user: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  triggered_at?: Date
  completed_at?: Date
  created_at: Date
}

export interface AirdropRecipient {
  id: string
  airdrop_id: string
  user_id: string
  wallet_address: string
  amount: number
  transaction_hash?: string
  status: 'pending' | 'sent' | 'failed'
  sent_at?: Date
  created_at: Date
}

export interface TerminalActivity {
  id: string
  activity_type: string
  message: string
  details?: any
  timestamp: Date
}