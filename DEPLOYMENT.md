# Krypt Terminal - Vercel Deployment Guide

## 🚨 SECURITY FIRST

**IMPORTANT**: Your API key was exposed publicly and needs to be revoked immediately:

1. Go to https://console.anthropic.com/settings/keys
2. **Revoke the exposed key** 
3. Generate a new API key
4. Use the new key in deployment

## 📁 Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── index.ts           # Main API + WebSocket server
│   ├── lib/
│   │   ├── blockchainDeveloper.ts  # Real Claude AI blockchain developer
│   │   ├── database.ts    # PostgreSQL connection
│   │   └── logger.ts      # Production logging
│   └── routes/            # API endpoints
├── frontend/              # React app
└── vercel.json           # Vercel configuration
```

## 🚀 Deployment Steps

### 1. Set Up Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Add Database (Vercel Postgres)

1. Go to Vercel Dashboard → Your Project
2. Click "Storage" tab
3. Click "Create Database" → "Postgres"
4. This automatically adds `DATABASE_URL` to your environment

### 3. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
ANTHROPIC_API_KEY=your_new_api_key_here
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
USE_MOCK_DATA=false
RUN_MIGRATIONS=true
```

### 4. Deploy

```bash
# Deploy to production
vercel --prod
```

## ✅ What Happens After Deployment

1. **Database Initialization**: Tables created automatically
2. **Blockchain Development Starts**: AI begins coding 640 components
3. **Real-Time Updates**: WebSocket broadcasts progress
4. **4 Phases Over 14 Days**:
   - Phase 1: Core Infrastructure (160 components)
   - Phase 2: Consensus Mechanism (160 components)  
   - Phase 3: Smart Contract Layer (160 components)
   - Phase 4: Network & Security (160 components)

## 📊 Monitoring

- **Live Progress**: Frontend displays real-time development
- **Database Logs**: All development activity stored
- **API Endpoints**:
  - `/api/progress` - Current blockchain progress
  - `/api/logs` - Development activity logs
  - `/api/stats` - Live statistics

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up local environment
cp .env.local .env
# Add your API key to .env

# Start development servers
npm run dev
```

## 💡 Features Working

✅ Real Claude AI blockchain development  
✅ WebSocket real-time updates  
✅ Database progress tracking  
✅ 4-phase development system  
✅ Live statistics  
✅ Vercel serverless deployment  

## 🚧 Next Steps

- Set up Vercel Postgres database
- Add your new (secure) API key
- Deploy and watch the AI build a real blockchain!

## 📞 Support

The AI will start developing immediately upon deployment with valid API key and database connection.