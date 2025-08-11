# 🚀 Krypt Terminal - AI-Powered Blockchain Development Platform

An advanced Web3 terminal where an AI agent ("Krypt") actively develops its own blockchain using Claude API while providing real-time chat support for users.

## 🚨 IMPORTANT SECURITY NOTICE

**Your API key was exposed publicly and needs to be revoked immediately:**
1. Go to https://console.anthropic.com/settings/keys
2. Revoke the exposed API key
3. Generate a new key for deployment

## 🚀 Quick Deploy to Vercel

1. **Setup Vercel:**
```bash
npm i -g vercel
vercel login
vercel link
```

2. **Add Database:**
   - Go to Vercel Dashboard → Storage → Create Postgres Database

3. **Set Environment Variables:**
   - In Vercel project settings, add your new API key
   
4. **Deploy:**
```bash
vercel --prod
```

## Project Structure

```
krypt-terminal/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── store/       # Zustand state management
│   │   └── styles/      # CSS files
│   └── package.json
├── backend/           # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   └── routes/      # API routes
│   └── package.json
└── CLAUDE.md         # Project memory file

```

## Features

- **Krypt Chat**: AI-powered chat interface for Web3 assistance
- **Terminal Display**: Live blockchain development visualization
- **Progress Tracking**: Real-time development progress monitoring
- **User System**: Wallet integration and rewards
- **High Performance**: Built to handle 10,000+ concurrent users

## Development Notes

- All mock data in development mode
- Real API integrations disabled by default
- WebSocket for real-time updates
- Terminal-themed UI with green-on-black aesthetic

## Scripts

```bash
# Development
npm run dev           # Start both frontend and backend
npm run dev:frontend  # Start frontend only
npm run dev:backend   # Start backend only

# Production
npm run build        # Build for production
npm run start        # Start production server
```

## Environment Variables

See `.env.example` for all available configuration options.