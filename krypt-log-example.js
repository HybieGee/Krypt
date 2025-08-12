// Example: How Krypt should send development logs to Cloudflare Worker
// This shows the correct API endpoints and data format for logging

const WORKER_URL = 'https://kryptterminal.com'
const API_KEY = 'krypt_api_key_2024'

// Example 1: Add a single development log
async function addDevelopmentLog(logData) {
  const response = await fetch(`${WORKER_URL}/api/logs/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey: API_KEY,
      log: {
        id: logData.id || `log-${Date.now()}`,
        timestamp: logData.timestamp || new Date().toISOString(),
        type: logData.type || 'code', // 'code', 'system', 'commit', 'test'
        message: logData.message,
        details: logData.details || {}
      }
    })
  })
  
  return await response.json()
}

// Example 2: Sync all logs (replace entire log history)
async function syncAllLogs(allLogs) {
  const response = await fetch(`${WORKER_URL}/api/logs/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey: API_KEY,
      logs: allLogs
    })
  })
  
  return await response.json()
}

// Example usage:

// 1. Adding a single log when Krypt develops a component
const result1 = await addDevelopmentLog({
  type: 'code',
  message: '✅ TokenContract.sol created (247 lines)',
  details: {
    componentName: 'TokenContract',
    linesOfCode: 247,
    phase: 2,
    filePath: 'contracts/TokenContract.sol',
    prompt: 'Create a comprehensive ERC-20 token contract with minting, burning, and pause functionality'
  }
})

// 2. Adding a system milestone log
const result2 = await addDevelopmentLog({
  type: 'system', 
  message: '🎯 Phase 2 Complete - Smart Contracts Implemented',
  details: {
    phase: 2,
    componentsCompleted: 2250,
    milestone: 'Smart Contract Foundation Complete'
  }
})

// 3. Adding a commit log
const result3 = await addDevelopmentLog({
  type: 'commit',
  message: '📦 Deployed 15 contracts to testnet',
  details: {
    commitHash: 'abc123...',
    filesChanged: 15,
    networkId: 'sepolia'
  }
})

// 4. Syncing entire log history (use sparingly)
const allLogHistory = [
  // Array of all historical logs...
]
const syncResult = await syncAllLogs(allLogHistory)

console.log('Log operations completed:', { result1, result2, result3, syncResult })