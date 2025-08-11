-- Krypt Terminal Database Schema

-- Users table
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
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    messages_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blockchain development progress
CREATE TABLE IF NOT EXISTS blockchain_progress (
    id SERIAL PRIMARY KEY,
    phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 4),
    component_number INTEGER NOT NULL CHECK (component_number >= 1 AND component_number <= 640),
    component_name VARCHAR(255) NOT NULL,
    description TEXT,
    code_snippet TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    lines_of_code INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(component_number)
);

-- Development logs
CREATE TABLE IF NOT EXISTS development_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id INTEGER REFERENCES blockchain_progress(component_number),
    action_type VARCHAR(50) NOT NULL, -- 'code_written', 'test_run', 'commit', 'phase_complete'
    description TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global statistics
CREATE TABLE IF NOT EXISTS global_stats (
    id SERIAL PRIMARY KEY,
    stat_name VARCHAR(50) UNIQUE NOT NULL,
    stat_value BIGINT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raffle entries
CREATE TABLE IF NOT EXISTS raffle_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    raffle_round INTEGER NOT NULL,
    ticket_count INTEGER DEFAULT 1,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_winner BOOLEAN DEFAULT false
);

-- Raffle rounds
CREATE TABLE IF NOT EXISTS raffle_rounds (
    id SERIAL PRIMARY KEY,
    round_number INTEGER UNIQUE NOT NULL,
    milestone_name VARCHAR(100),
    total_tickets INTEGER DEFAULT 0,
    winner_user_id UUID REFERENCES users(id),
    prize_amount DECIMAL(18, 8),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' -- active, completed, cancelled
);

-- Airdrops
CREATE TABLE IF NOT EXISTS airdrops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airdrop_name VARCHAR(100) NOT NULL,
    total_recipients INTEGER DEFAULT 0,
    total_amount DECIMAL(18, 8),
    amount_per_user DECIMAL(18, 8),
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    triggered_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airdrop recipients
CREATE TABLE IF NOT EXISTS airdrop_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airdrop_id UUID REFERENCES airdrops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Terminal activity (for display purposes)
CREATE TABLE IF NOT EXISTS terminal_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_session ON users(session_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_blockchain_progress_phase ON blockchain_progress(phase);
CREATE INDEX idx_blockchain_progress_status ON blockchain_progress(status);
CREATE INDEX idx_development_logs_timestamp ON development_logs(timestamp);
CREATE INDEX idx_raffle_entries_user ON raffle_entries(user_id);
CREATE INDEX idx_raffle_entries_round ON raffle_entries(raffle_round);
CREATE INDEX idx_terminal_activity_timestamp ON terminal_activity(timestamp);

-- Initialize global stats
INSERT INTO global_stats (stat_name, stat_value) VALUES
    ('total_users', 0),
    ('early_access_users', 0),
    ('total_lines_of_code', 0),
    ('total_commits', 0),
    ('total_tests_run', 0),
    ('components_completed', 0),
    ('current_phase', 1),
    ('total_messages_sent', 0),
    ('total_raffle_tickets', 0),
    ('total_airdrops_sent', 0)
ON CONFLICT (stat_name) DO NOTHING;

-- Function to update user last_active
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_active = CURRENT_TIMESTAMP 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active on new message
CREATE TRIGGER update_last_active_on_message
AFTER INSERT ON chat_messages
FOR EACH ROW
WHEN (NEW.role = 'user')
EXECUTE FUNCTION update_user_last_active();

-- Function to update global stats
CREATE OR REPLACE FUNCTION increment_global_stat(stat_name_param VARCHAR, increment_value INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE global_stats 
    SET stat_value = stat_value + increment_value,
        last_updated = CURRENT_TIMESTAMP
    WHERE stat_name = stat_name_param;
END;
$$ LANGUAGE plpgsql;