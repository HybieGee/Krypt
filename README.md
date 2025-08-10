# Krypt Terminal

AI-powered Web3 development platform with autonomous blockchain development capabilities.

## Quick Start

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Setup environment:**
```bash
cp .env.development .env
```

3. **Start development servers:**
```bash
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

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