# Krypt Terminal Project Memory

## Project Overview
Building a Web3 AI terminal website for Krypt Terminal - an AI agent specialized in web3 development that builds its own blockchain.

## Key Components
1. **Krypt Chat** (Right Panel) - AI chat interface for users
   - Memecoin trading support
   - Wallet research capabilities
   - Individual user sessions

2. **Krypt Terminal** (Left Panel) - Live blockchain coding display
   - No user interaction
   - Shows continuous blockchain development
   - Shared view for all users

## Technical Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + WebSocket
- Database: PostgreSQL + Redis
- Infrastructure: Cloudflare CDN
- APIs: Claude AI, GitHub, Web3

## Critical Requirements
- Must handle 100s-10,000s concurrent users
- Terminal theme (green on black aesthetic)
- 640 blockchain components over 2 weeks (4 phases)
- Raffle/credit system for user rewards
- Airdrop distribution capability
- Live statistics tracking

## Development Guidelines
- Use environment variables for all API keys
- Separate dev/prod databases
- Mock data for development (no real blockchain calls during dev)
- Use feature flags for incomplete features
- All sensitive operations behind API authentication

## Data Strategy
- Development: Use mock/test data that can be reset
- Production: Real data with proper backups
- Never mix dev and prod data
- Use migrations for database changes

## Testing Approach
- Local development with mock Claude AI responses
- Simulated blockchain development progress
- Test user system with fake wallets
- Load testing before production

## Security Considerations
- No Claude AI attribution visible to users
- API keys in environment variables only
- Rate limiting on all endpoints
- CORS properly configured
- Input validation on all user inputs

## Performance Targets
- Page load: < 2 seconds
- Real-time updates: < 100ms latency
- Support 10,000+ concurrent WebSocket connections
- CDN caching for static assets
- Database connection pooling

## Commands to Run
```bash
# Frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run tests

# Backend
npm run server   # Start backend server
npm run dev:api  # Start with nodemon
```

## Environment Setup
Create `.env` files (never commit these):
- `.env.development` - Development settings
- `.env.production` - Production settings (added during deployment)

## Current Phase
Setting up initial project structure with separation between dev and prod environments.