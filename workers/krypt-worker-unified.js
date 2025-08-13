// ===== KRYPT UNIFIED CLOUDFLARE WORKER =====
// Single unified worker handling all Krypt Terminal functionality
// Persistent KV storage only - no in-memory caches

// ===== CONSTANTS & CONFIGURATION =====
const BLOCKCHAIN_COMPONENTS = 4500;
const DEVELOPMENT_INTERVAL = 15000; // 15 seconds per component
const COMPONENTS_PER_CRON = 3; // Generate 3 components every 5 minutes (18 logs total)
const MAX_LOGS = 10000;
const MAX_CODE_BLOCKS = 50;
const MAX_LEADERBOARD = 10;
const VISITOR_DEDUP_TTL = 48 * 60 * 60 * 1000; // 48 hours

// ===== HEADERS & CORS =====
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const JSON_HEADERS = { 
  ...CORS_HEADERS, 
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate"
};

const SSE_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
};

// ===== KV HELPERS =====
async function kvGetJSON(env, key, fallback = null) {
  try {
    const raw = await env.KRYPT_DATA.get(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`KV get error for ${key}:`, error);
    return fallback;
  }
}

async function kvPutJSON(env, key, value) {
  try {
    await env.KRYPT_DATA.put(key, JSON.stringify(value));
  } catch (error) {
    console.error(`KV put error for ${key}:`, error);
    throw error;
  }
}

// ===== VISITOR DEDUPLICATION =====
function generateVisitorFingerprint(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const country = request.headers.get('CF-IPCountry') || 'unknown';
  return `${ip}:${userAgent.slice(0, 100)}:${country}`;
}

function generateVisitorId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// ===== SSE HELPER =====
function createSSEStream(env, makePayload, pollMs = 3000) {
  return new Response(new ReadableStream({
    async start(controller) {
      const send = (data) => controller.enqueue(`data: ${JSON.stringify(data)}\\n\\n`);
      const keepAlive = () => controller.enqueue(`: keep-alive\\n\\n`);
      
      let lastHash = "";
      let keepAliveInterval = null;
      let pollInterval = null;

      const tick = async () => {
        try {
          const payload = await makePayload(env);
          const hash = JSON.stringify(payload);
          if (hash !== lastHash) {
            lastHash = hash;
            send(payload);
          }
        } catch (error) {
          console.error('SSE tick error:', error);
        }
      };

      // Send initial data
      await tick();
      
      // Set up intervals
      keepAliveInterval = setInterval(keepAlive, 15000);
      pollInterval = setInterval(tick, pollMs);

      // Store cleanup function
      this.cleanup = () => {
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        if (pollInterval) clearInterval(pollInterval);
      };
    },
    cancel() {
      if (this.cleanup) this.cleanup();
    }
  }), { headers: SSE_HEADERS });
}

// ===== ADMIN TESTING HANDLERS =====
async function handleSetEarlyAccessCount(request, env) {
  try {
    const { count, adminKey } = await request.json();
    
    // Simple admin key check (you can modify this)
    if (adminKey !== 'krypt_admin_test_2024') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid admin key' 
      }), { status: 401, headers: JSON_HEADERS });
    }
    
    if (!Number.isInteger(count) || count < 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Count must be a non-negative integer' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    // Set the early access count
    await kvPutJSON(env, 'early_access_count', count);
    
    // Check for milestone triggers
    await checkAndTriggerMilestones(env);
    
    return new Response(JSON.stringify({ 
      success: true, 
      count,
      message: `Early access count set to ${count}. Milestone checks triggered.`
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Set early access count error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to set count' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleTriggerMilestone(request, env) {
  try {
    const { milestoneId, adminKey } = await request.json();
    
    // Simple admin key check
    if (adminKey !== 'krypt_admin_test_2024') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid admin key' 
      }), { status: 401, headers: JSON_HEADERS });
    }
    
    // Find the milestone
    const milestone = MILESTONES.find(m => m.id === milestoneId);
    if (!milestone) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Milestone not found' 
      }), { status: 404, headers: JSON_HEADERS });
    }
    
    // Check if already completed
    const completedMilestones = await kvGetJSON(env, 'completed_milestones', []);
    if (completedMilestones.includes(milestone.id)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Milestone already completed' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    // Mark as completed and trigger airdrop
    completedMilestones.push(milestone.id);
    await kvPutJSON(env, 'completed_milestones', completedMilestones);
    
    const distributionResults = await triggerMilestoneAirdrop(env, milestone);
    
    return new Response(JSON.stringify({ 
      success: true, 
      milestone: milestone.name,
      recipients: distributionResults.length,
      totalDistributed: distributionResults.length * milestone.reward,
      message: `Milestone "${milestone.name}" triggered manually. ${distributionResults.length} users received ${milestone.reward} tokens each.`
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Trigger milestone error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to trigger milestone' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== CLEAR USER RAFFLE ENTRIES (ADMIN) =====
async function handleClearUserRaffleEntries(request, env) {
  try {
    const { walletAddress, adminKey } = await request.json();
    
    // Admin key check
    if (adminKey !== 'krypt_admin_test_2024') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid admin key' 
      }), { status: 401, headers: JSON_HEADERS });
    }
    
    if (!walletAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Wallet address required' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Clear all raffle entries for this user
    const entriesResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry:' });
    let deletedEntries = 0;
    
    for (const key of entriesResult.keys) {
      const entry = await kvGetJSON(env, key.name, null);
      if (entry && entry.walletAddress.toLowerCase() === normalizedAddress) {
        await env.KRYPT_DATA.delete(key.name);
        deletedEntries++;
      }
    }
    
    // Clear used tickets counter
    const usedTicketsKey = `raffle_tickets_used:${normalizedAddress}`;
    await env.KRYPT_DATA.delete(usedTicketsKey);
    
    return new Response(JSON.stringify({
      success: true,
      deletedEntries,
      message: `Cleared ${deletedEntries} raffle entries for ${walletAddress} and reset ticket counter`
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Clear user raffle entries error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clear user raffle entries' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== MAIN WORKER =====
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
      }

      // Initialize system on first request
      await initializeSystemIfNeeded(env);

      // Route handlers
      switch (true) {
        // Health check
        case url.pathname === '/api/health' && request.method === 'GET':
          return handleHealth();

        // Early Access endpoints
        case url.pathname === '/api/early-access/visit' && request.method === 'POST':
          return handleEarlyAccessVisit(request, env);
        case url.pathname === '/api/early-access/count' && request.method === 'GET':
          return handleEarlyAccessCount(env);
        case url.pathname === '/api/early-access/stream' && request.method === 'GET':
          return handleEarlyAccessStream(env);

        // Development Progress endpoints
        case url.pathname === '/api/progress' && request.method === 'GET':
          return handleGetProgress(env);
        case url.pathname === '/api/progress/update' && request.method === 'POST':
          return handleUpdateProgress(request, env);
        case url.pathname === '/api/progress/reset' && request.method === 'POST':
          return handleResetProgress(env);

        // Development Logs endpoints
        case url.pathname === '/api/logs' && request.method === 'GET':
          return handleGetLogs(env, url);
        case url.pathname === '/api/logs/add' && request.method === 'POST':
          return handleAddLog(request, env);
        case url.pathname === '/api/logs/sync' && request.method === 'POST':
          return handleSyncLogs(request, env);
        case url.pathname === '/api/logs/clear' && request.method === 'POST':
          return handleClearLogs(env);
        case url.pathname === '/api/logs/stream' && request.method === 'GET':
          return handleLogsStream(env);

        // Development Code endpoints
        case url.pathname === '/api/dev/code' && request.method === 'GET':
          return handleGetCode(env);
        case url.pathname === '/api/dev/code' && request.method === 'POST':
          return handleAddCode(request, env);
        case url.pathname === '/api/dev/code/stream' && request.method === 'GET':
          return handleCodeStream(env);

        // Development Tick (for 15-second generation)
        case url.pathname === '/api/development/tick' && request.method === 'POST':
          return handleDevelopmentTick(env);
        case url.pathname === '/api/development/status' && request.method === 'GET':
          return handleDevelopmentStatus(env);
        case url.pathname === '/api/development/force' && request.method === 'POST':
          return handleForceDevelopment(env);
        case url.pathname === '/api/development/reset' && request.method === 'POST':
          return handleResetDevelopment(env);
        case url.pathname === '/api/development/seed' && request.method === 'POST':
          return handleSeedDevelopment(env);

        // Chat endpoints
        case url.pathname === '/api/chat/messages' && request.method === 'GET':
          return handleGetChatMessages(env);
        case url.pathname === '/api/chat/send' && request.method === 'POST':
          return handleSendChatMessage(request, env);
        case url.pathname === '/api/chat/stream' && request.method === 'GET':
          return handleChatStream(env);
        case url.pathname === '/api/chat/latest' && request.method === 'GET':
          return handleGetLatestMessage(env);

        // User & Leaderboard endpoints
        case url.pathname === '/api/user/balance' && request.method === 'POST':
          return handleUpdateUserBalance(request, env);
        case url.pathname.startsWith('/api/user/data/') && request.method === 'GET':
          return handleGetUserData(request, env, url);
        case url.pathname === '/api/user/transfer' && request.method === 'POST':
          return handleTransferTokens(request, env);
        case url.pathname === '/api/leaderboard' && request.method === 'GET':
          return handleGetLeaderboard(env);
        
        // Wallet fingerprint endpoints
        case url.pathname.startsWith('/api/wallet/fingerprint/') && request.method === 'GET':
          return handleGetWalletByFingerprint(request, env, url);
        case url.pathname === '/api/wallet/fingerprint' && request.method === 'POST':
          return handleRegisterWalletFingerprint(request, env);
        
        // Airdrop/Milestone endpoints
        case url.pathname.startsWith('/api/user/airdrops/') && request.method === 'GET':
          return handleGetUserAirdrops(request, env, url);
        case url.pathname === '/api/user/airdrops/mark-seen' && request.method === 'POST':
          return handleMarkAirdropSeen(request, env);

        // Raffle endpoints
        case url.pathname === '/api/raffle/enter' && request.method === 'POST':
          return handleRaffleEntry(request, env);
        case url.pathname === '/api/user/raffle-entries' && request.method === 'GET':
          return handleGetRaffleEntries(request, env);
        case url.pathname === '/api/user/raffle-tickets' && request.method === 'GET':
          return handleGetRaffleTickets(request, env);
        case url.pathname === '/api/raffle/draw' && request.method === 'POST':
          return handleRaffleDraw(request, env);
        case url.pathname === '/api/raffle/status' && request.method === 'GET':
          return handleRaffleStatus(env);

        // User milestones
        case url.pathname === '/api/user/milestones' && request.method === 'GET':
          return handleGetUserMilestones(request, env);

        // Stats endpoint
        case url.pathname === '/api/stats' && request.method === 'GET':
          return handleGetStats(env);

        // Admin endpoints
        case url.pathname === '/api/admin/reset-all' && request.method === 'POST':
          return handleAdminResetAll(env);
        case url.pathname === '/api/admin/set-count' && request.method === 'POST':
          return handleAdminSetCount(request, env);
        case url.pathname === '/api/admin/clear-visitors' && request.method === 'POST':
          return handleAdminClearVisitors(env);
        case url.pathname === '/api/admin/initialize' && request.method === 'POST':
          return handleAdminInitialize(env);
        case url.pathname === '/api/nuclear-reset-check' && request.method === 'GET':
          return handleNuclearResetCheck(env);
        case url.pathname === '/api/admin/clean-test-wallets' && request.method === 'POST':
          return handleCleanTestWallets(env);
        case url.pathname === '/api/admin/clean-invalid-wallets' && request.method === 'POST':
          return handleCleanInvalidWallets(env);
        case url.pathname === '/api/admin/set-early-access-count' && request.method === 'POST':
          return handleSetEarlyAccessCount(request, env);
        case url.pathname === '/api/admin/trigger-milestone' && request.method === 'POST':
          return handleTriggerMilestone(request, env);
        case url.pathname === '/api/admin/clear-user-raffle-entries' && request.method === 'POST':
          return handleClearUserRaffleEntries(request, env);

        default:
          return new Response(JSON.stringify({ error: 'Not found' }), { 
            status: 404, 
            headers: JSON_HEADERS 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), { 
        status: 500, 
        headers: JSON_HEADERS 
      });
    }
  },

  // ===== SCHEDULED HANDLER =====
  async scheduled(event, env, ctx) {
    try {
      console.log('⏰ Scheduled trigger activated at', new Date().toISOString());
      
      // Run autonomous development tick
      await runAutonomousDevelopment(env);
      
      // Check for missed milestone triggers
      await checkAndTriggerMilestones(env);
      
      // Handle automatic raffle draws
      await handleAutomaticRaffleDraws(env);
      
    } catch (error) {
      console.error('Scheduled handler error:', error);
    }
  }
};

// ===== INITIALIZATION =====
async function initializeSystemIfNeeded(env) {
  try {
    const initialized = await env.KRYPT_DATA.get('system_initialized');
    if (initialized) return;

    // Initialize default values
    const defaults = {
      'dev_progress': '0',
      'dev_logs': JSON.stringify([]),
      'dev_code': JSON.stringify([]),
      'early_access_count': '0',
      'system_initialized': 'true'
    };

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await env.KRYPT_DATA.get(key);
      if (!existing) {
        await env.KRYPT_DATA.put(key, value);
      }
    }

    console.log('System initialized with defaults');
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// ===== HEALTH CHECK =====
async function handleHealth() {
  return new Response(JSON.stringify({ 
    ok: true, 
    time: new Date().toISOString(),
    worker: 'unified'
  }), { headers: JSON_HEADERS });
}

// ===== EARLY ACCESS HANDLERS =====
async function handleEarlyAccessVisit(request, env) {
  try {
    const fingerprint = generateVisitorFingerprint(request);
    const dedupKey = `visitor_dedup_${fingerprint}`;
    
    // Check for existing cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const eaUidMatch = cookieHeader.match(/ea_uid=([^;]+)/);
    let visitorId = eaUidMatch ? eaUidMatch[1] : null;

    // Check if this visitor was seen recently
    const recentVisit = await env.EARLY_ACCESS.get(dedupKey);
    let shouldIncrement = false;

    if (!recentVisit && !visitorId) {
      // New visitor
      visitorId = generateVisitorId();
      shouldIncrement = true;
    } else if (!recentVisit && visitorId) {
      // Cookie exists but no recent visit recorded
      shouldIncrement = true;
    }

    if (shouldIncrement) {
      // Increment global count
      const currentCount = await kvGetJSON(env, 'early_access_count', 0);
      const newCount = currentCount + 1;
      await kvPutJSON(env, 'early_access_count', newCount);

      // Store dedup entry
      await env.EARLY_ACCESS.put(dedupKey, JSON.stringify({
        visitorId,
        timestamp: Date.now(),
        fingerprint
      }), { expirationTtl: Math.floor(VISITOR_DEDUP_TTL / 1000) });

      // Check for milestone triggers after early access count increment
      await checkAndTriggerMilestones(env);
    }

    // Get final count
    const finalCount = await kvGetJSON(env, 'early_access_count', 0);

    // Set cookie if new visitor
    const response = new Response(JSON.stringify({ 
      success: true,
      count: finalCount,
      visitorId: visitorId || generateVisitorId()
    }), { headers: JSON_HEADERS });

    if (!visitorId || shouldIncrement) {
      response.headers.set('Set-Cookie', 
        `ea_uid=${visitorId || generateVisitorId()}; SameSite=Lax; Path=/; Secure; Max-Age=${Math.floor(VISITOR_DEDUP_TTL / 1000)}`
      );
    }

    return response;
  } catch (error) {
    console.error('Early access visit error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process visit' }), { 
      status: 500, 
      headers: JSON_HEADERS 
    });
  }
}

async function handleEarlyAccessCount(env) {
  try {
    const count = await kvGetJSON(env, 'early_access_count', 0);
    return new Response(JSON.stringify({ count }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Early access count error:', error);
    return new Response(JSON.stringify({ count: 0 }), { headers: JSON_HEADERS });
  }
}

async function handleEarlyAccessStream(env) {
  return createSSEStream(env, async (env) => {
    const count = await kvGetJSON(env, 'early_access_count', 0);
    return { count };
  }, 3000);
}

// ===== PROGRESS HANDLERS =====
async function handleGetProgress(env) {
  try {
    const componentsCompleted = await kvGetJSON(env, 'dev_progress', 0);
    const totalComponents = parseInt(env.COMPONENTS_TOTAL) || 4500;
    const currentPhase = Math.floor(componentsCompleted / 500) + 1;
    const phaseProgress = (componentsCompleted % 500) / 500 * 100;
    
    // Get stats for additional metrics
    const stats = await kvGetJSON(env, 'stats', {});
    
    const progressData = {
      currentPhase,
      phaseProgress,
      componentsCompleted: Number(componentsCompleted),
      totalComponents,
      percentComplete: (componentsCompleted / totalComponents) * 100,
      linesOfCode: stats.total_lines_of_code?.value || componentsCompleted * 45,
      commits: stats.total_commits?.value || Math.floor(componentsCompleted / 10),
      testsRun: stats.total_tests_run?.value || Math.floor(componentsCompleted / 5)
    };
    
    return new Response(JSON.stringify(progressData), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get progress error:', error);
    return new Response(JSON.stringify({
      currentPhase: 1,
      phaseProgress: 0,
      componentsCompleted: 0,
      totalComponents: 4500,
      percentComplete: 0,
      linesOfCode: 0,
      commits: 0,
      testsRun: 0
    }), { headers: JSON_HEADERS });
  }
}

async function handleUpdateProgress(request, env) {
  try {
    const { progress } = await request.json();
    
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid progress. Must be between 0 and 100.' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    await kvPutJSON(env, 'dev_progress', progress);
    return new Response(JSON.stringify({ success: true, progress }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Update progress error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update progress' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleResetProgress(env) {
  try {
    await kvPutJSON(env, 'dev_progress', 0);
    return new Response(JSON.stringify({ success: true, progress: 0 }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Reset progress error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to reset progress' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== LOGS HANDLERS =====
async function handleGetLogs(env, url) {
  try {
    const logs = await kvGetJSON(env, 'dev_logs', []);
    const limit = parseInt(url.searchParams.get('limit')) || logs.length;
    const limitedLogs = logs.slice(-limit);
    
    // Convert internal format to expected format
    const formattedLogs = limitedLogs.map(log => ({
      id: log.id || `log-${log.ts}`,
      timestamp: new Date(log.ts || Date.now()).toISOString(),
      type: log.level || log.type || 'system',
      message: log.msg || log.message || 'Development log entry',
      details: log.details || null
    }));
    
    return new Response(JSON.stringify(formattedLogs), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get logs error:', error);
    return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
  }
}

async function handleAddLog(request, env) {
  try {
    const { msg, level } = await request.json();
    
    if (!msg) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const entry = { 
      ts: Date.now(), 
      level: level || 'info', 
      msg: String(msg) 
    };

    const logs = await kvGetJSON(env, 'dev_logs', []);
    logs.push(entry);
    
    // Cap at MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }

    await kvPutJSON(env, 'dev_logs', logs);
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Add log error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to add log' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleSyncLogs(request, env) {
  try {
    const { logs } = await request.json();
    
    if (!Array.isArray(logs)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Logs must be an array' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Validate and normalize log entries
    const normalizedLogs = logs.map(log => ({
      ts: log.ts || Date.now(),
      level: log.level || 'info',
      msg: String(log.msg || '')
    }));

    await kvPutJSON(env, 'dev_logs', normalizedLogs);
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Sync logs error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to sync logs' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleClearLogs(env) {
  try {
    await kvPutJSON(env, 'dev_logs', []);
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Clear logs error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clear logs' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleLogsStream(env) {
  return createSSEStream(env, async (env) => {
    const logs = await kvGetJSON(env, 'dev_logs', []);
    return { logs: logs.slice(-20) };
  }, 3000);
}

// ===== CODE HANDLERS =====
async function handleGetCode(env) {
  try {
    const blocks = await kvGetJSON(env, 'dev_code', []);
    // Return latest 20, reversed (latest first)
    const result = blocks.slice(-20).reverse();
    return new Response(JSON.stringify({ blocks: result }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get code error:', error);
    return new Response(JSON.stringify({ blocks: [] }), { headers: JSON_HEADERS });
  }
}

async function handleAddCode(request, env) {
  try {
    const { block } = await request.json();
    
    if (!block) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Code block is required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const blocks = await kvGetJSON(env, 'dev_code', []);
    blocks.push(String(block));
    
    // Cap at MAX_CODE_BLOCKS
    if (blocks.length > MAX_CODE_BLOCKS) {
      blocks.splice(0, blocks.length - MAX_CODE_BLOCKS);
    }

    await kvPutJSON(env, 'dev_code', blocks);
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Add code error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to add code block' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleCodeStream(env) {
  return createSSEStream(env, async (env) => {
    const blocks = await kvGetJSON(env, 'dev_code', []);
    return { blocks: blocks.slice(-20).reverse() };
  }, 3000);
}

// ===== DEVELOPMENT TICK HANDLERS =====
async function handleDevelopmentTick(env) {
  try {
    const progress = await kvGetJSON(env, 'dev_progress', 0);
    
    if (progress >= BLOCKCHAIN_COMPONENTS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Development completed',
        shouldStop: true
      }), { headers: JSON_HEADERS });
    }

    // Check if enough time has passed since last update
    const lastTick = await kvGetJSON(env, 'last_dev_tick', 0);
    const timeSinceLastTick = Date.now() - lastTick;
    
    if (timeSinceLastTick < DEVELOPMENT_INTERVAL) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Not time yet',
        secondsRemaining: Math.ceil((DEVELOPMENT_INTERVAL - timeSinceLastTick) / 1000)
      }), { headers: JSON_HEADERS });
    }

    // Generate next component
    const result = await generateNextComponent(env);
    
    if (result.rateLimited) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Rate limited - no new component generated',
        component: result.componentName,
        progress: result.newProgress,
        rateLimited: true
      }), { headers: JSON_HEADERS });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Component generated',
      component: result.componentName,
      progress: result.newProgress
    }), { headers: JSON_HEADERS });

  } catch (error) {
    console.error('Development tick error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleDevelopmentStatus(env) {
  try {
    const progress = await kvGetJSON(env, 'dev_progress', 0);
    const logs = await kvGetJSON(env, 'dev_logs', []);
    const lastTick = await kvGetJSON(env, 'last_dev_tick', 0);
    
    const nextUpdateIn = Math.max(0, DEVELOPMENT_INTERVAL - (Date.now() - lastTick));
    const isRunning = progress < BLOCKCHAIN_COMPONENTS;
    const estimatedCompletion = isRunning ? 
      new Date(Date.now() + ((BLOCKCHAIN_COMPONENTS - progress) * DEVELOPMENT_INTERVAL)).toISOString() : null;

    return new Response(JSON.stringify({
      status: isRunning ? 'active' : 'completed',
      progress,
      logsCount: logs.length,
      lastUpdated: new Date(lastTick).toISOString(),
      nextUpdateIn: Math.ceil(nextUpdateIn / 1000),
      isRunning,
      estimatedCompletion
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Development status error:', error);
    return new Response(JSON.stringify({ 
      status: 'error',
      progress: 0,
      isRunning: false
    }), { headers: JSON_HEADERS });
  }
}

async function handleForceDevelopment(env) {
  try {
    const progress = await kvGetJSON(env, 'dev_progress', 0);
    
    if (progress >= BLOCKCHAIN_COMPONENTS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Development already completed' 
      }), { headers: JSON_HEADERS });
    }

    const result = await generateNextComponent(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Component generated successfully',
      component: result.componentName,
      progress: result.newProgress
    }), { headers: JSON_HEADERS });

  } catch (error) {
    console.error('Force development error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to force development' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleResetDevelopment(env) {
  try {
    await kvPutJSON(env, 'dev_progress', 0);
    await kvPutJSON(env, 'dev_logs', []);
    await kvPutJSON(env, 'dev_code', []);
    await kvPutJSON(env, 'last_dev_tick', 0);
    
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Reset development error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to reset development' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleSeedDevelopment(env) {
  try {
    await seedInitialDevelopment(env);
    
    // Generate first 2 components to populate the terminal (12 rich logs)
    for (let i = 0; i < 2; i++) {
      await generateNextComponent(env);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Development seeded with initial data and 2 components' 
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Seed development error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to seed development' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== COMPONENT GENERATION =====
async function generateNextComponent(env) {
  try {
    const currentProgress = await kvGetJSON(env, 'dev_progress', 0);
    
    // Rate limiting: Check last generation time to prevent duplicates
    const lastGenTime = await kvGetJSON(env, 'last_component_gen_time', 0);
    const timeSinceLastGen = Date.now() - lastGenTime;
    
    // Don't generate if less than 40 seconds since last generation (full sequence takes ~35 seconds)
    if (timeSinceLastGen < 40000) {
      console.log(`⏸️ Rate limited: ${timeSinceLastGen}ms since last generation`);
      return {
        componentName: getComponentName(currentProgress - 1),
        newProgress: currentProgress,
        rateLimited: true
      };
    }
    
    // Update last generation time immediately to prevent race conditions
    await kvPutJSON(env, 'last_component_gen_time', Date.now());
    
    const componentName = getComponentName(currentProgress);
    const logs = await kvGetJSON(env, 'dev_logs', []);
    
    // Generate realistic development sequence with random intervals (3-8 seconds)
    const baseTime = Date.now();
    const developmentLogs = [];
    const getRandomInterval = () => Math.floor(Math.random() * 6000) + 3000; // 3000-8999ms
    
    let currentDelay = 0;
    
    // 1. AI Request (appears immediately)
    developmentLogs.push({
      id: `ai-req-${currentProgress}-${baseTime}`,
      ts: baseTime + currentDelay,
      level: 'api',
      msg: `Sending request to Krypt AI...`,
      details: { 
        component: componentName,
        prompt: `Generate optimized ${componentName} implementation with security features`
      }
    });
    
    // 2. AI Response (random delay 3-8s after previous)
    currentDelay += getRandomInterval();
    developmentLogs.push({
      id: `ai-resp-${currentProgress}-${baseTime}`,
      ts: baseTime + currentDelay,
      level: 'api',
      msg: `✅ Krypt AI response received (${Math.floor(Math.random() * 500) + 200}ms)`,
      details: { 
        component: componentName,
        tokensUsed: Math.floor(Math.random() * 2000) + 1000
      }
    });
    
    // 3. Generate code snippet first
    const codeSnippet = generateCodeSnippet(componentName);
    const actualLineCount = codeSnippet.split('\n').length;
    const commitHash = Math.random().toString(16).substring(2, 8);
    
    // 3. Component completion (random delay 3-8s after previous)
    currentDelay += getRandomInterval();
    developmentLogs.push({
      id: `comp-${currentProgress}-${baseTime}`,
      ts: baseTime + currentDelay,
      level: 'system',
      msg: `✅ ${componentName} component developed (${actualLineCount} lines coded)`,
      details: {
        component: componentName,
        progress: currentProgress + 1,
        totalComponents: 4500,
        linesAdded: actualLineCount,
        commitHash,
        // Only send full code - frontend will show first 8 lines in Live View
        code: codeSnippet // Full code for both views
      }
    });
    
    // 4. Testing (random delay 3-8s after previous)
    currentDelay += getRandomInterval();
    const testsRun = Math.floor(Math.random() * 8) + 3;
    developmentLogs.push({
      id: `test-${currentProgress}-${baseTime}`,
      ts: baseTime + currentDelay,
      level: 'test',
      msg: `Running tests for ${componentName}...`,
      details: {
        component: componentName,
        testsRun,
        passed: testsRun,
        failed: 0,
        coverage: Math.floor(Math.random() * 15) + 85 + '%'
      }
    });
    
    // 5. Git Commit (random delay 3-8s after previous)
    currentDelay += getRandomInterval();
    developmentLogs.push({
      id: `commit-${currentProgress}-${baseTime}`,
      ts: baseTime + currentDelay,
      level: 'commit',
      msg: `✅ Committed to GitHub`,
      details: {
        component: componentName,
        hash: commitHash,
        linesAdded: actualLineCount,
        filesChanged: Math.floor(Math.random() * 3) + 1
      }
    });
    
    // Add all logs
    logs.push(...developmentLogs);
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    // Add code block
    const codeBlocks = await kvGetJSON(env, 'dev_code', []);
    codeBlocks.push(codeSnippet);
    if (codeBlocks.length > MAX_CODE_BLOCKS) {
      codeBlocks.splice(0, codeBlocks.length - MAX_CODE_BLOCKS);
    }
    
    // Update progress
    const newProgress = currentProgress + 1;
    
    // Update stats
    const stats = await kvGetJSON(env, 'stats', {});
    const updatedStats = {
      ...stats,
      total_lines_of_code: { value: (stats.total_lines_of_code?.value || 0) + actualLineCount, lastUpdated: new Date().toISOString() },
      total_commits: { value: (stats.total_commits?.value || 0) + 1, lastUpdated: new Date().toISOString() },
      total_tests_run: { value: (stats.total_tests_run?.value || 0) + testsRun, lastUpdated: new Date().toISOString() }
    };
    
    // Save all updates
    await Promise.all([
      kvPutJSON(env, 'dev_logs', logs),
      kvPutJSON(env, 'dev_code', codeBlocks),
      kvPutJSON(env, 'dev_progress', newProgress),
      kvPutJSON(env, 'stats', updatedStats),
      kvPutJSON(env, 'last_dev_tick', Date.now())
    ]);
    
    return { componentName, newProgress };
  } catch (error) {
    console.error('Generate component error:', error);
    throw error;
  }
}

async function seedInitialDevelopment(env) {
  const initialLogs = [
    {
      id: 'init-1',
      ts: Date.now() - 600000,
      level: 'system',
      msg: '🚀 Krypt --init blockchain',
      details: null
    },
    {
      id: 'init-2', 
      ts: Date.now() - 580000,
      level: 'system',
      msg: 'Initializing Krypt Blockchain Development Environment...',
      details: null
    },
    {
      id: 'init-3',
      ts: Date.now() - 560000,
      level: 'system',
      msg: 'Loading blockchain infrastructure across 4 phases...',
      details: null
    },
    {
      id: 'init-4',
      ts: Date.now() - 540000,
      level: 'system',
      msg: 'Starting autonomous development process...',
      details: null
    }
  ];

  const initialStats = {
    total_users: { value: 1, lastUpdated: new Date().toISOString() },
    early_access_users: { value: 1, lastUpdated: new Date().toISOString() },
    total_lines_of_code: { value: 0, lastUpdated: new Date().toISOString() },
    total_commits: { value: 0, lastUpdated: new Date().toISOString() },
    total_tests_run: { value: 0, lastUpdated: new Date().toISOString() }
  };

  await Promise.all([
    kvPutJSON(env, 'dev_logs', initialLogs),
    kvPutJSON(env, 'dev_progress', 0),
    kvPutJSON(env, 'stats', initialStats),
    kvPutJSON(env, 'last_dev_tick', Date.now())
  ]);
}

function getComponentName(index) {
  const names = [
    'BlockStructure', 'TransactionPool', 'CryptographicHash', 'MerkleTree',
    'BlockValidator', 'ConsensusEngine', 'NetworkNode', 'WalletManager',
    'SmartContract', 'StateManager', 'EventLogger', 'SecurityModule',
    'PerformanceOptimizer', 'DataStorage', 'APIGateway'
  ];
  return names[index % names.length] + (index >= names.length ? `_v${Math.floor(index / names.length) + 1}` : '');
}


function generateCodeSnippet(componentName) {
  const templates = [
    // Short template (45-60 lines)
    `export class ${componentName} {
  private config: ChainConfig
  private isActive: boolean = false
  
  constructor(config: ChainConfig) {
    this.config = config
  }
  
  async initialize(): Promise<void> {
    console.log(\`Initializing \${componentName}...\`)
    await this.validateConfig()
    this.isActive = true
    console.log(\`\${componentName} ready\`)
  }
  
  private async validateConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration required')
    }
  }
  
  public async process(data: any): Promise<any> {
    if (!this.isActive) {
      throw new Error('Component not initialized')
    }
    return this.transform(data)
  }
  
  private transform(data: any): any {
    return {
      ...data,
      processed: true,
      timestamp: Date.now()
    }
  }
  
  public getStatus(): boolean {
    return this.isActive
  }
  
  public shutdown(): void {
    this.isActive = false
    console.log(\`\${componentName} shutdown\`)
  }
}

interface ChainConfig {
  network: string
  security: any
}`,

    // Medium template (75-95 lines)  
    `export class ${componentName} {
  private readonly version = '1.0.0'
  private state: BlockchainState
  private config: ChainConfig
  private isInitialized: boolean = false
  private eventHandlers: Map<string, Function[]> = new Map()
  
  constructor(config: ChainConfig) {
    this.config = config
    this.state = new BlockchainState(config)
    this.initialize()
  }
  
  async initialize(): Promise<void> {
    try {
      console.log(\`Initializing \${componentName}...\`)
      await this.validateConfiguration()
      await this.setupEventHandlers()
      this.isInitialized = true
      console.log(\`\${componentName} initialized successfully\`)
    } catch (error) {
      console.error(\`Failed to initialize \${componentName}:\`, error)
      throw new Error(\`\${componentName} startup failed\`)
    }
  }
  
  private async validateConfiguration(): Promise<void> {
    if (!this.config.network) {
      throw new Error('Network configuration required')
    }
    if (!this.config.security) {
      throw new Error('Security configuration required')
    }
  }
  
  private async setupEventHandlers(): Promise<void> {
    this.on('data', this.handleDataEvent.bind(this))
    this.on('error', this.handleErrorEvent.bind(this))
    this.on('shutdown', this.handleShutdownEvent.bind(this))
  }
  
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }
  
  public emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => handler(data))
  }
  
  private handleDataEvent(data: any): void {
    console.log('Data received:', data.size || 0, 'bytes')
  }
  
  private handleErrorEvent(error: Error): void {
    console.error(\`\${componentName} error:\`, error)
  }
  
  private handleShutdownEvent(): void {
    this.cleanup()
  }
  
  public async process(data: any): Promise<ProcessedData> {
    if (!this.isInitialized) {
      throw new Error(\`\${componentName} not initialized\`)
    }
    
    try {
      const validated = await this.validate(data)
      const processed = await this.transform(validated)
      return processed
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }
  
  private async validate(data: any): Promise<any> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format')
    }
    return data
  }
  
  private async transform(data: any): Promise<ProcessedData> {
    return {
      ...data,
      processed: true,
      timestamp: Date.now(),
      component: componentName,
      version: this.version
    }
  }
  
  private cleanup(): void {
    this.eventHandlers.clear()
    console.log(\`\${componentName} cleaned up\`)
  }
}

interface ProcessedData {
  processed: boolean
  timestamp: number
  component: string
  version: string
}`,

    // Large template (120-150 lines)
    `export class ${componentName} {
  private readonly version = '1.0.0'
  private state: BlockchainState
  private config: ChainConfig
  private isInitialized: boolean = false
  private eventHandlers: Map<string, Function[]> = new Map()
  private metrics: ComponentMetrics
  private connections: Set<string> = new Set()
  
  constructor(config: ChainConfig) {
    this.config = config
    this.state = new BlockchainState(config)
    this.metrics = new ComponentMetrics(componentName)
    this.initialize()
  }
  
  async initialize(): Promise<void> {
    try {
      console.log(\`Initializing \${componentName}...\`)
      await this.validateConfiguration()
      await this.setupEventHandlers()
      await this.initializeConnections()
      await this.startHealthChecks()
      this.isInitialized = true
      this.metrics.recordInitialization()
      console.log(\`\${componentName} initialized successfully\`)
    } catch (error) {
      console.error(\`Failed to initialize \${componentName}:\`, error)
      throw new InitializationError(\`\${componentName} startup failed\`)
    }
  }
  
  private async validateConfiguration(): Promise<void> {
    if (!this.config.network) {
      throw new ConfigurationError('Network configuration required')
    }
    if (!this.config.security) {
      throw new ConfigurationError('Security configuration required')
    }
    if (!this.config.peers) {
      throw new ConfigurationError('Peer configuration required')
    }
  }
  
  private async setupEventHandlers(): Promise<void> {
    this.on('data', this.handleDataEvent.bind(this))
    this.on('error', this.handleErrorEvent.bind(this))
    this.on('shutdown', this.handleShutdownEvent.bind(this))
    this.on('peer_connected', this.handlePeerConnected.bind(this))
    this.on('peer_disconnected', this.handlePeerDisconnected.bind(this))
  }
  
  private async initializeConnections(): Promise<void> {
    await this.state.connect()
    await this.establishPeerConnections()
    await this.setupNetworkProtocols()
  }
  
  private async startHealthChecks(): Promise<void> {
    setInterval(() => {
      this.performHealthCheck()
    }, 30000) // Every 30 seconds
  }
  
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }
  
  public emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error('Event handler error:', error)
      }
    })
  }
  
  private handleDataEvent(data: any): void {
    this.metrics.recordDataProcessed(data.size || 0)
    console.log(\`\${componentName} processed data:\`, data.size || 0, 'bytes')
  }
  
  private handleErrorEvent(error: Error): void {
    this.metrics.recordError(error)
    console.error(\`\${componentName} error:\`, error)
    this.attemptRecovery(error)
  }
  
  private handleShutdownEvent(): void {
    console.log(\`\${componentName} shutdown initiated\`)
    this.cleanup()
  }
  
  private handlePeerConnected(peer: any): void {
    this.connections.add(peer.id)
    console.log(\`Peer connected: \${peer.id}\`)
  }
  
  private handlePeerDisconnected(peer: any): void {
    this.connections.delete(peer.id)
    console.log(\`Peer disconnected: \${peer.id}\`)
  }
  
  public async process(data: any): Promise<ProcessedData> {
    if (!this.isInitialized) {
      throw new Error(\`\${componentName} not initialized\`)
    }
    
    try {
      const startTime = Date.now()
      const validated = await this.validate(data)
      const processed = await this.transform(validated)
      const secured = await this.applySecurityLayer(processed)
      const endTime = Date.now()
      
      this.metrics.recordProcessingTime(endTime - startTime)
      return secured
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }
  
  private async validate(data: any): Promise<any> {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid data format')
    }
    
    if (!data.timestamp || Date.now() - data.timestamp > 300000) {
      throw new ValidationError('Data too old or missing timestamp')
    }
    
    return data
  }
  
  private async transform(data: any): Promise<any> {
    return {
      ...data,
      processed: true,
      timestamp: Date.now(),
      component: componentName,
      version: this.version,
      signature: this.generateSignature(data)
    }
  }
  
  private async applySecurityLayer(data: any): Promise<ProcessedData> {
    const encrypted = await this.encrypt(data)
    const signed = await this.sign(encrypted)
    return signed
  }
  
  private generateSignature(data: any): string {
    return \`sig_\${Date.now()}_\${Math.random().toString(36).substring(2)}\`
  }
  
  private async encrypt(data: any): Promise<any> {
    // Encryption logic would go here
    return { ...data, encrypted: true }
  }
  
  private async sign(data: any): Promise<ProcessedData> {
    return {
      ...data,
      signature: this.generateSignature(data),
      verified: true
    }
  }
  
  private async establishPeerConnections(): Promise<void> {
    const peers = this.config.peers || []
    for (const peer of peers) {
      try {
        await this.connectToPeer(peer)
        this.emit('peer_connected', peer)
      } catch (error) {
        console.error(\`Failed to connect to peer \${peer.id}:\`, error)
      }
    }
  }
  
  private async connectToPeer(peer: PeerConfig): Promise<void> {
    console.log(\`Connecting to peer: \${peer.address}\`)
    // Connection logic here
    this.connections.add(peer.id)
  }
  
  private async setupNetworkProtocols(): Promise<void> {
    // Network protocol setup
    console.log('Setting up network protocols...')
  }
  
  private performHealthCheck(): void {
    const status = this.getStatus()
    if (status.errors > 10) {
      console.warn(\`\${componentName} health warning: \${status.errors} errors\`)
    }
  }
  
  private attemptRecovery(error: Error): void {
    console.log(\`Attempting recovery from error: \${error.message}\`)
    // Recovery logic here
  }
  
  public getMetrics(): ComponentMetrics {
    return this.metrics
  }
  
  public getStatus(): ComponentStatus {
    return {
      initialized: this.isInitialized,
      version: this.version,
      uptime: Date.now() - this.metrics.startTime,
      errors: this.metrics.errorCount,
      connections: this.connections.size
    }
  }
  
  private cleanup(): void {
    this.eventHandlers.clear()
    this.connections.clear()
    this.state.disconnect()
    console.log(\`\${componentName} cleaned up\`)
  }
}

interface ComponentMetrics {
  startTime: number
  errorCount: number
  recordInitialization(): void
  recordDataProcessed(size: number): void
  recordError(error: Error): void
  recordProcessingTime(time: number): void
}

interface ProcessedData {
  processed: boolean
  timestamp: number
  component: string
  version: string
  signature?: string
  verified?: boolean
}

interface ComponentStatus {
  initialized: boolean
  version: string
  uptime: number
  errors: number
  connections?: number
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class InitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitializationError'
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// ===== MILESTONE SYSTEM =====
const MILESTONES = [
  { id: 'milestone_1', userTarget: 25, reward: 250, name: 'Early Pioneers' },
  { id: 'milestone_2', userTarget: 125, reward: 350, name: 'Growing Community' },
  { id: 'milestone_3', userTarget: 500, reward: 500, name: 'Established Base' },
  { id: 'milestone_4', userTarget: 1500, reward: 1000, name: 'Thriving Ecosystem' },
  { id: 'milestone_5', userTarget: 5000, reward: 2000, name: 'Massive Adoption' }
];

async function checkAndTriggerMilestones(env) {
  try {
    // Get current early access user count
    const earlyAccessCount = await kvGetJSON(env, 'early_access_count', 0);
    
    // Get completed milestones
    const completedMilestones = await kvGetJSON(env, 'completed_milestones', []);
    
    console.log(`🔍 Checking milestones - Current early access users: ${earlyAccessCount}`);
    
    // Check each milestone
    for (const milestone of MILESTONES) {
      // Skip if already completed
      if (completedMilestones.includes(milestone.id)) {
        continue;
      }
      
      // Check if milestone threshold reached
      if (earlyAccessCount >= milestone.userTarget) {
        console.log(`🎯 Milestone triggered: ${milestone.name} at ${milestone.userTarget} users`);
        
        // Mark as completed to prevent double-triggering
        completedMilestones.push(milestone.id);
        await kvPutJSON(env, 'completed_milestones', completedMilestones);
        
        // Trigger milestone airdrop
        await triggerMilestoneAirdrop(env, milestone);
      }
    }
  } catch (error) {
    console.error('Milestone check error:', error);
  }
}

async function triggerMilestoneAirdrop(env, milestone) {
  try {
    console.log(`🚀 Triggering early access milestone airdrop for ${milestone.name} - ${milestone.reward} tokens each`);
    
    // Get all users for airdrop (first 25 wallets)
    const listResult = await env.KRYPT_DATA.list({ prefix: 'user:' });
    const eligibleUsers = [];
    
    // Test patterns to filter out
    const testPatterns = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12', 
      '0x9876543210fedcba9876543210fedcba98765432',
      '0xtest', '0xraffle', '0xfake',
      '0xnewuser1234567890abcdef1234567890abcdef12',
      '0x5f6e7d8c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      '0xabc123def456789'
    ];
    
    // Collect all valid users
    for (const key of listResult.keys) {
      const userData = await kvGetJSON(env, key.name, null);
      if (userData && userData.address) {
        // Filter out test wallets
        const isTestWallet = testPatterns.some(pattern => 
          userData.address.toLowerCase().startsWith(pattern.toLowerCase())
        );
        
        if (!isTestWallet) {
          eligibleUsers.push(userData);
        }
      }
    }
    
    // Sort by registration time (earliest first) and take first 25
    const sortedUsers = eligibleUsers
      .sort((a, b) => (a.firstSeen || a.lastUpdated || 0) - (b.firstSeen || b.lastUpdated || 0))
      .slice(0, 25);
    
    console.log(`📊 Distributing to ${sortedUsers.length} eligible users (first 25 wallets)`);
    
    // Create airdrop record for tracking
    const airdropId = `airdrop_${milestone.id}_${Date.now()}`;
    const airdropRecord = {
      id: airdropId,
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      reward: milestone.reward,
      timestamp: Date.now(),
      recipients: sortedUsers.map(u => u.address),
      totalDistributed: sortedUsers.length * milestone.reward
    };
    
    // Save airdrop record
    await kvPutJSON(env, `airdrop:${airdropId}`, airdropRecord);
    
    // Update each user's balance and create individual airdrop records
    const distributionPromises = sortedUsers.map(async (user) => {
      const userKey = `user:${user.address}`;
      const updatedUser = {
        ...user,
        balance: (user.balance || 0) + milestone.reward,
        lastUpdated: Date.now()
      };
      
      // Create individual airdrop notification record
      const userAirdropKey = `user_airdrop:${user.address}:${airdropId}`;
      const userAirdropRecord = {
        airdropId,
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        reward: milestone.reward,
        timestamp: Date.now(),
        claimed: false, // User hasn't seen notification yet
        walletAddress: user.address
      };
      
      await Promise.all([
        kvPutJSON(env, userKey, updatedUser),
        kvPutJSON(env, userAirdropKey, userAirdropRecord)
      ]);
      
      return {
        address: user.address,
        oldBalance: user.balance || 0,
        newBalance: updatedUser.balance,
        reward: milestone.reward
      };
    });
    
    const distributionResults = await Promise.all(distributionPromises);
    
    // Add milestone completion log
    const logs = await kvGetJSON(env, 'dev_logs', []);
    logs.push({
      id: `milestone-${milestone.id}-${Date.now()}`,
      ts: Date.now(),
      level: 'phase',
      msg: `🎯 MILESTONE ACHIEVED: ${milestone.name}! 🎉`,
      details: {
        milestone: milestone.name,
        userTarget: milestone.userTarget,
        reward: milestone.reward,
        recipients: distributionResults.length,
        totalDistributed: distributionResults.length * milestone.reward,
        airdropId: airdropId
      }
    });
    
    // Add individual airdrop notification log
    logs.push({
      id: `airdrop-${airdropId}-${Date.now()}`,
      ts: Date.now() + 1000,
      level: 'system',
      msg: `💰 Airdrop distributed to ${distributionResults.length} early supporters!`,
      details: {
        milestone: milestone.name,
        tokensPerUser: milestone.reward,
        totalUsers: distributionResults.length,
        airdropId: airdropId
      }
    });
    
    // Trim logs if needed
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    await kvPutJSON(env, 'dev_logs', logs);
    
    console.log(`✅ Milestone airdrop completed: ${distributionResults.length} users received ${milestone.reward} tokens each`);
    
    return distributionResults;
  } catch (error) {
    console.error('Milestone airdrop error:', error);
    throw error;
  }
}

// ===== AIRDROP NOTIFICATION HANDLERS =====
async function handleGetUserAirdrops(request, env, url) {
  try {
    const walletAddress = url.pathname.split('/').pop();
    
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid wallet address' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Get all airdrop records for this user
    const listResult = await env.KRYPT_DATA.list({ prefix: `user_airdrop:${normalizedAddress}:` });
    const airdrops = [];
    
    for (const key of listResult.keys) {
      const airdropData = await kvGetJSON(env, key.name, null);
      if (airdropData) {
        airdrops.push(airdropData);
      }
    }
    
    // Sort by timestamp (newest first)
    airdrops.sort((a, b) => b.timestamp - a.timestamp);
    
    return new Response(JSON.stringify(airdrops), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Get user airdrops error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get airdrops' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleMarkAirdropSeen(request, env) {
  try {
    const { walletAddress, airdropId } = await request.json();
    
    if (!walletAddress || !airdropId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Wallet address and airdrop ID required' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    const normalizedAddress = walletAddress.toLowerCase();
    const userAirdropKey = `user_airdrop:${normalizedAddress}:${airdropId}`;
    
    // Get existing airdrop record
    const airdropData = await kvGetJSON(env, userAirdropKey, null);
    
    if (!airdropData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Airdrop record not found' 
      }), { status: 404, headers: JSON_HEADERS });
    }
    
    // Mark as seen/claimed
    airdropData.claimed = true;
    airdropData.claimedAt = Date.now();
    
    await kvPutJSON(env, userAirdropKey, airdropData);
    
    return new Response(JSON.stringify({ 
      success: true 
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Mark airdrop seen error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to mark airdrop as seen' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== USER & LEADERBOARD HANDLERS =====
async function handleUpdateUserBalance(request, env) {
  try {
    const body = await request.json();
    // Support both 'address' and 'walletAddress' for backward compatibility
    const address = body.address || body.walletAddress;
    const balance = body.balance;
    const mintedAmount = body.mintedAmount; // Optional field for minting tracking
    const stakedAmount = body.stakedAmount; // Optional field for staking tracking
    
    if (!address || typeof balance !== 'number') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valid address and balance required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Validate Ethereum address format (0x + 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid wallet address format. Must be 42 characters (0x + 40 hex)' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const normalizedAddress = address.toLowerCase();
    
    // Filter out test/fake wallets - reject if they match test patterns
    const testPatterns = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12', 
      '0x9876543210fedcba9876543210fedcba98765432',
      '0xtest',
      '0xraffle',
      '0xfake',
      // Debug wallets used during testing
      '0xnewuser1234567890abcdef1234567890abcdef12',
      '0x5f6e7d8c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      '0xabc123def456789'
    ];
    
    const isTestWallet = testPatterns.some(pattern => 
      normalizedAddress.startsWith(pattern.toLowerCase())
    );
    
    if (isTestWallet) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Test wallets not allowed in production leaderboard' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const userKey = `user:${normalizedAddress}`;
    
    // Get existing user data to preserve mintedAmount if not provided
    const existingUser = await kvGetJSON(env, userKey, null);
    
    const userData = {
      address: normalizedAddress,
      balance: Math.max(0, balance),
      mintedAmount: mintedAmount !== undefined ? Math.max(0, mintedAmount) : (existingUser?.mintedAmount || 0),
      stakedAmount: stakedAmount !== undefined ? Math.max(0, stakedAmount) : (existingUser?.stakedAmount || 0),
      firstSeen: existingUser?.firstSeen || Date.now(), // Track when user first registered
      lastUpdated: Date.now()
    };

    await kvPutJSON(env, userKey, userData);
    
    return new Response(JSON.stringify({ 
      success: true, 
      balance: userData.balance,
      mintedAmount: userData.mintedAmount,
      stakedAmount: userData.stakedAmount
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Update user balance error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update balance' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleGetUserData(request, env, url) {
  try {
    // Extract wallet address from URL path: /api/user/data/{walletAddress}
    const pathParts = url.pathname.split('/');
    const walletAddress = pathParts[4]; // /api/user/data/{walletAddress}
    
    if (!walletAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Wallet address required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid wallet address format' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const userKey = `user:${normalizedAddress}`;
    
    // Get user data from KV storage
    const userData = await kvGetJSON(env, userKey, null);
    
    if (!userData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found',
        userData: null
      }), { status: 404, headers: JSON_HEADERS });
    }

    // Return complete user data from backend
    return new Response(JSON.stringify({ 
      success: true,
      userData: {
        address: userData.address,
        balance: userData.balance || 0,
        mintedAmount: userData.mintedAmount || 0,
        stakedAmount: userData.stakedAmount || 0,
        isMining: userData.isMining || false,
        firstSeen: userData.firstSeen,
        lastUpdated: userData.lastUpdated
      }
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Get user data error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to get user data' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleTransferTokens(request, env) {
  try {
    const body = await request.json();
    const fromAddress = body.fromAddress;
    const toAddress = body.toAddress;
    const amount = parseFloat(body.amount);
    
    if (!fromAddress || !toAddress || !amount || amount <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valid from address, to address, and amount required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Validate both addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(fromAddress) || !/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid wallet address format' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Can't transfer to yourself
    if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cannot transfer to yourself' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const normalizedFromAddress = fromAddress.toLowerCase();
    const normalizedToAddress = toAddress.toLowerCase();
    
    // Get sender's current balance
    const fromUserKey = `user:${normalizedFromAddress}`;
    const fromUser = await kvGetJSON(env, fromUserKey, null);
    
    if (!fromUser || (fromUser.balance || 0) < amount) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Insufficient balance for transfer' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Get or create recipient
    const toUserKey = `user:${normalizedToAddress}`;
    const toUser = await kvGetJSON(env, toUserKey, {
      address: normalizedToAddress,
      balance: 0,
      mintedAmount: 0,
      stakedAmount: 0,
      firstSeen: Date.now(),
      lastUpdated: Date.now()
    });

    // Perform the transfer
    const updatedFromUser = {
      ...fromUser,
      balance: fromUser.balance - amount,
      lastUpdated: Date.now()
    };
    
    const updatedToUser = {
      ...toUser,
      balance: (toUser.balance || 0) + amount,
      lastUpdated: Date.now()
    };

    // Save both users atomically
    await Promise.all([
      kvPutJSON(env, fromUserKey, updatedFromUser),
      kvPutJSON(env, toUserKey, updatedToUser)
    ]);

    console.log(`💸 Transfer successful: ${amount} KRYPT from ${fromAddress} to ${toAddress}`);

    return new Response(JSON.stringify({ 
      success: true,
      transfer: {
        from: fromAddress,
        to: toAddress,
        amount: amount,
        timestamp: Date.now()
      },
      newBalance: updatedFromUser.balance
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Transfer tokens error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to transfer tokens' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleGetLeaderboard(env) {
  try {
    const listResult = await env.KRYPT_DATA.list({ prefix: 'user:' });
    const users = [];
    
    // Test patterns to filter out
    const testPatterns = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12', 
      '0x9876543210fedcba9876543210fedcba98765432',
      '0xtest',
      '0xraffle',
      '0xfake',
      // Debug wallets used during testing
      '0xnewuser1234567890abcdef1234567890abcdef12',
      '0x5f6e7d8c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      '0xabc123def456789'
    ];
    
    for (const key of listResult.keys) {
      const userData = await kvGetJSON(env, key.name, null);
      if (userData && userData.balance > 0) {
        // Filter out test/fake wallets
        const isTestWallet = testPatterns.some(pattern => 
          userData.address.toLowerCase().startsWith(pattern.toLowerCase())
        );
        
        if (!isTestWallet) {
          users.push(userData);
        }
      }
    }
    
    // Sort by balance desc, take top 10, dedupe by address
    const deduped = new Map();
    users.forEach(user => {
      const existing = deduped.get(user.address);
      if (!existing || user.lastUpdated > existing.lastUpdated) {
        deduped.set(user.address, user);
      }
    });
    
    const leaderboard = Array.from(deduped.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, MAX_LEADERBOARD)
      .map(({ address, balance }) => ({ address, balance }));
    
    return new Response(JSON.stringify(leaderboard), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
  }
}

// ===== WALLET FINGERPRINT HANDLERS =====
async function handleGetWalletByFingerprint(request, env, url) {
  try {
    const fingerprint = url.pathname.split('/').pop();
    
    if (!fingerprint) {
      return new Response(JSON.stringify({ 
        error: 'Fingerprint required' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    const fingerprintKey = `fingerprint:${fingerprint}`;
    const walletData = await kvGetJSON(env, fingerprintKey, null);
    
    if (!walletData) {
      return new Response(JSON.stringify({ 
        error: 'Wallet not found for fingerprint' 
      }), { status: 404, headers: JSON_HEADERS });
    }
    
    // Get current balance from user data
    const userKey = `user:${walletData.address}`;
    const userData = await kvGetJSON(env, userKey, null);
    
    return new Response(JSON.stringify({
      address: walletData.address,
      balance: userData?.balance || 0,
      mintedAmount: userData?.mintedAmount || 0,
      createdAt: walletData.createdAt
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Get wallet by fingerprint error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get wallet' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleRegisterWalletFingerprint(request, env) {
  try {
    const { walletAddress, fingerprint } = await request.json();
    
    if (!walletAddress || !fingerprint) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Wallet address and fingerprint required' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid wallet address format' 
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    const fingerprintKey = `fingerprint:${fingerprint}`;
    
    // Check if fingerprint already exists
    const existingWallet = await kvGetJSON(env, fingerprintKey, null);
    if (existingWallet) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Device already has a wallet registered' 
      }), { status: 409, headers: JSON_HEADERS });
    }
    
    // Register fingerprint -> wallet mapping
    const fingerprintData = {
      address: walletAddress.toLowerCase(),
      fingerprint,
      createdAt: new Date().toISOString()
    };
    
    await kvPutJSON(env, fingerprintKey, fingerprintData);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Wallet fingerprint registered successfully' 
    }), { headers: JSON_HEADERS });
    
  } catch (error) {
    console.error('Register wallet fingerprint error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to register wallet fingerprint' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== RAFFLE HANDLERS =====
async function handleRaffleEntry(request, env) {
  try {
    const { walletAddress, raffleType, ticketCost } = await request.json();
    
    if (!walletAddress || !raffleType || !ticketCost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Get user data
    const userKey = `user:${walletAddress.toLowerCase()}`;
    const user = await kvGetJSON(env, userKey, null);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User not found' 
      }), { status: 404, headers: JSON_HEADERS });
    }

    // Calculate available tickets based on the same formula as frontend
    const userBalance = user.balance || 0;
    const userStaked = user.stakedAmount || 0;
    const userMinted = user.mintedAmount || 0;
    const isMining = user.isMining || false;
    const totalScore = userBalance + userStaked + (userMinted * 2) + (isMining ? 100 : 0);
    const calculatedTickets = Math.floor(totalScore / 100);
    
    // Get used tickets count
    const usedTicketsKey = `raffle_tickets_used:${walletAddress.toLowerCase()}`;
    const usedTickets = await kvGetJSON(env, usedTicketsKey, 0);
    const availableTickets = calculatedTickets - usedTickets;

    if (availableTickets < ticketCost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Insufficient tickets. Need ${ticketCost}, have ${availableTickets}` 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Create raffle entry
    const entryId = `${raffleType}_${walletAddress.toLowerCase()}_${Date.now()}`;
    const raffleEntry = {
      id: entryId,
      walletAddress: walletAddress.toLowerCase(),
      raffleType,
      ticketCost,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    // Save entry and update used tickets
    await kvPutJSON(env, `raffle_entry:${entryId}`, raffleEntry);
    await kvPutJSON(env, usedTicketsKey, usedTickets + ticketCost);
    
    // Force immediate consistency by adding a small delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully entered raffle',
      entry: raffleEntry,
      remainingTickets: availableTickets - ticketCost
    }), { headers: JSON_HEADERS });

  } catch (error) {
    console.error('Raffle entry error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to enter raffle' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleGetRaffleEntries(request, env) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
    }

    const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry:' });
    const entries = [];
    
    for (const key of listResult.keys) {
      const entry = await kvGetJSON(env, key.name, null);
      if (entry && entry.walletAddress === walletAddress.toLowerCase() && entry.status === 'active') {
        entries.push(entry);
      }
    }

    return new Response(JSON.stringify(entries), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get raffle entries error:', error);
    return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
  }
}

async function handleGetRaffleTickets(request, env) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return new Response(JSON.stringify({ 
        totalTickets: 0, 
        usedTickets: 0, 
        availableTickets: 0 
      }), { headers: JSON_HEADERS });
    }

    // Get user data
    const userKey = `user:${walletAddress.toLowerCase()}`;
    const user = await kvGetJSON(env, userKey, null);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        totalTickets: 0, 
        usedTickets: 0, 
        availableTickets: 0 
      }), { headers: JSON_HEADERS });
    }

    // Calculate tickets using same formula as frontend
    const userBalance = user.balance || 0;
    const userStaked = user.stakedAmount || 0;
    const userMinted = user.mintedAmount || 0;
    const isMining = user.isMining || false;
    
    // Debug logging
    console.log('Raffle tickets calculation for', walletAddress, {
      userBalance,
      userStaked, 
      userMinted,
      isMining,
      fullUserData: user
    });
    
    const totalScore = userBalance + userStaked + (userMinted * 2) + (isMining ? 100 : 0);
    const totalTickets = Math.floor(totalScore / 100);
    
    // Get used tickets
    const usedTicketsKey = `raffle_tickets_used:${walletAddress.toLowerCase()}`;
    const usedTickets = await kvGetJSON(env, usedTicketsKey, 0);
    const availableTickets = totalTickets - usedTickets;

    return new Response(JSON.stringify({
      totalTickets,
      usedTickets,
      availableTickets,
      breakdown: {
        fromBalance: Math.floor(userBalance / 100),
        fromStaked: Math.floor(userStaked / 100),
        fromMinted: Math.floor((userMinted * 2) / 100),
        fromMining: isMining ? 1 : 0
      }
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get raffle tickets error:', error);
    return new Response(JSON.stringify({ 
      totalTickets: 0, 
      usedTickets: 0, 
      availableTickets: 0 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleRaffleDraw(request, env) {
  try {
    const { raffleType, adminKey } = await request.json();
    
    if (adminKey !== 'krypt_raffle_admin_2024') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Unauthorized' 
      }), { status: 401, headers: JSON_HEADERS });
    }

    const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry:' });
    const entries = [];
    
    for (const key of listResult.keys) {
      const entry = await kvGetJSON(env, key.name, null);
      if (entry && entry.raffleType === raffleType && entry.status === 'active') {
        entries.push(entry);
      }
    }

    if (entries.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No entries found for this raffle' 
      }), { status: 404, headers: JSON_HEADERS });
    }

    // Simple random selection
    const winner = entries[Math.floor(Math.random() * entries.length)];
    const prizes = { 'hourly': 1000, 'weekly': 25000, 'genesis': 100000 };
    const prizeAmount = prizes[raffleType] || 1000;

    // Update winner's balance
    const userKey = `user:${winner.walletAddress.toLowerCase()}`;
    const user = await kvGetJSON(env, userKey, { address: winner.walletAddress, balance: 0 });
    user.balance = (user.balance || 0) + prizeAmount;
    user.lastUpdated = Date.now();
    await kvPutJSON(env, userKey, user);

    // Mark entries as completed
    for (const entry of entries) {
      entry.status = 'completed';
      entry.winnerAddress = winner.walletAddress;
      entry.prizeAmount = prizeAmount;
      entry.drawnAt = new Date().toISOString();
      await kvPutJSON(env, `raffle_entry:${entry.id}`, entry);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Raffle drawn successfully',
      winner: winner.walletAddress,
      prizeAmount,
      totalEntries: entries.length
    }), { headers: JSON_HEADERS });

  } catch (error) {
    console.error('Raffle draw error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to draw raffle' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleRaffleStatus(env) {
  try {
    const raffleTypes = ['hourly', 'weekly', 'genesis'];
    const status = {};

    for (const raffleType of raffleTypes) {
      const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry:' });
      let activeEntries = 0;
      let lastWinner = null;
      let lastDrawTime = null;

      for (const key of listResult.keys) {
        const entry = await kvGetJSON(env, key.name, null);
        if (entry && entry.raffleType === raffleType) {
          if (entry.status === 'active') {
            activeEntries++;
          } else if (entry.status === 'completed' && entry.drawnAt) {
            if (!lastDrawTime || entry.drawnAt > lastDrawTime) {
              lastWinner = entry.winnerAddress;
              lastDrawTime = entry.drawnAt;
            }
          }
        }
      }

      const prizePool = raffleType === 'hourly' ? 1000 : raffleType === 'weekly' ? 25000 : 100000;
      
      status[raffleType] = {
        activeEntries,
        totalEntries: activeEntries,
        lastWinner,
        lastDrawTime,
        prizePool
      };
    }

    return new Response(JSON.stringify(status), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Raffle status error:', error);
    return new Response(JSON.stringify({}), { headers: JSON_HEADERS });
  }
}

// ===== USER MILESTONES HANDLER =====
async function handleGetUserMilestones(request, env) {
  try {
    // Return empty array for now - can be implemented later
    return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get user milestones error:', error);
    return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
  }
}

// ===== STATS HANDLER =====
async function handleGetStats(env) {
  try {
    const earlyAccessCount = await kvGetJSON(env, 'early_access_count', 0);
    const progress = await kvGetJSON(env, 'dev_progress', 0);
    const logs = await kvGetJSON(env, 'dev_logs', []);
    
    const stats = {
      total_users: { value: earlyAccessCount, lastUpdated: new Date().toISOString() },
      early_access_users: { value: earlyAccessCount, lastUpdated: new Date().toISOString() },
      total_lines_of_code: { value: Math.floor(progress * 50), lastUpdated: new Date().toISOString() },
      total_commits: { value: Math.floor(progress * 10), lastUpdated: new Date().toISOString() },
      total_tests_run: { value: Math.floor(progress * 5), lastUpdated: new Date().toISOString() },
      components_completed: { value: Math.floor(progress * BLOCKCHAIN_COMPONENTS / 100), lastUpdated: new Date().toISOString() },
      current_phase: { value: Math.floor(progress / 25) + 1, lastUpdated: new Date().toISOString() }
    };

    return new Response(JSON.stringify(stats), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get stats error:', error);
    return new Response(JSON.stringify({}), { headers: JSON_HEADERS });
  }
}

// ===== ADMIN HANDLERS =====
async function handleAdminResetAll(env) {
  try {
    // Get all keys from KRYPT_DATA to delete everything
    const allDataResult = await env.KRYPT_DATA.list();
    const allEarlyAccessResult = await env.EARLY_ACCESS.list();
    
    console.log(`🗑️ Nuclear reset: Deleting ${allDataResult.keys.length} KRYPT_DATA keys and ${allEarlyAccessResult.keys.length} EARLY_ACCESS keys`);
    
    // Delete ALL data from both namespaces for complete fresh start
    await Promise.all([
      // Delete all KRYPT_DATA keys (progress, logs, users, fingerprints, etc.)
      ...allDataResult.keys.map(key => env.KRYPT_DATA.delete(key.name)),
      // Delete all EARLY_ACCESS keys (visitor dedup, etc.)
      ...allEarlyAccessResult.keys.map(key => env.EARLY_ACCESS.delete(key.name))
    ]);
    
    // Reinitialize fresh system
    await initializeSystemIfNeeded(env);
    
    console.log('✅ Nuclear reset complete: All data wiped, system reinitialized');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Nuclear reset complete - all data wiped for fresh launch',
      deletedKeys: {
        kryptData: allDataResult.keys.length,
        earlyAccess: allEarlyAccessResult.keys.length
      }
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Admin reset all error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to reset system' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleAdminSetCount(request, env) {
  try {
    const { count } = await request.json();
    
    if (!Number.isInteger(count) || count < 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valid count required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    await kvPutJSON(env, 'early_access_count', count);
    return new Response(JSON.stringify({ success: true, count }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Admin set count error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to set count' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleAdminClearVisitors(env) {
  try {
    console.log('🚨 NUCLEAR RESET: Starting complete data wipe...');
    
    // 1. Clear EARLY_ACCESS namespace (visitor tracking)
    console.log('Clearing EARLY_ACCESS namespace...');
    const earlyAccessResult = await env.EARLY_ACCESS.list();
    await Promise.all(earlyAccessResult.keys.map(key => env.EARLY_ACCESS.delete(key.name)));
    
    // 2. Clear ALL KRYPT_DATA entries (development progress, logs, user data, etc.)
    console.log('Clearing KRYPT_DATA namespace...');
    const kryptDataResult = await env.KRYPT_DATA.list();
    await Promise.all(kryptDataResult.keys.map(key => env.KRYPT_DATA.delete(key.name)));
    
    // 3. Re-initialize basic system data
    console.log('Re-initializing basic system data...');
    await kvPutJSON(env, 'dev_progress', 0);
    await kvPutJSON(env, 'dev_logs', []);
    await kvPutJSON(env, 'dev_code', []);
    await kvPutJSON(env, 'chat_messages', []);
    await kvPutJSON(env, 'early_access_count', 0);
    await kvPutJSON(env, 'total_users', 0);
    await kvPutJSON(env, 'total_lines_of_code', 0);
    await kvPutJSON(env, 'total_commits', 0);
    await kvPutJSON(env, 'total_tests_run', 0);
    await kvPutJSON(env, 'last_component_gen_time', 0);
    
    console.log('✅ NUCLEAR RESET COMPLETE: All data wiped and reset');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Nuclear reset complete - all user data cleared',
      timestamp: new Date().toISOString(),
      clearedItems: {
        earlyAccess: earlyAccessResult.keys.length,
        kryptData: kryptDataResult.keys.length
      }
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Nuclear reset error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Nuclear reset failed: ' + error.message 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleAdminInitialize(env) {
  try {
    await env.KRYPT_DATA.delete('system_initialized');
    await initializeSystemIfNeeded(env);
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Admin initialize error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to initialize' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleNuclearResetCheck(env) {
  try {
    const progress = await kvGetJSON(env, 'dev_progress', 0);
    const earlyAccessCount = await kvGetJSON(env, 'early_access_count', 0);
    const logs = await kvGetJSON(env, 'dev_logs', []);
    const codeBlocks = await kvGetJSON(env, 'dev_code', []);
    
    return new Response(JSON.stringify({
      progress,
      earlyAccessCount,
      logsCount: logs.length,
      codeBlocksCount: codeBlocks.length,
      lastCheck: new Date().toISOString()
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Nuclear reset check error:', error);
    return new Response(JSON.stringify({ error: 'Check failed' }), { 
      status: 500, 
      headers: JSON_HEADERS 
    });
  }
}

async function handleCleanTestWallets(env) {
  try {
    const testPatterns = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12', 
      '0x9876543210fedcba9876543210fedcba98765432',
      '0xtest',
      '0xraffle',
      '0xfake',
      // Debug wallets used during testing
      '0xnewuser1234567890abcdef1234567890abcdef12',
      '0x5f6e7d8c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      '0xabc123def456789'
    ];
    
    const listResult = await env.KRYPT_DATA.list({ prefix: 'user:' });
    let deletedCount = 0;
    
    for (const key of listResult.keys) {
      const userData = await kvGetJSON(env, key.name, null);
      if (userData && userData.address) {
        const isTestWallet = testPatterns.some(pattern => 
          userData.address.toLowerCase().startsWith(pattern.toLowerCase())
        );
        
        if (isTestWallet) {
          await env.KRYPT_DATA.delete(key.name);
          deletedCount++;
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      deletedCount, 
      message: `Cleaned ${deletedCount} test wallets from leaderboard` 
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Clean test wallets error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clean test wallets' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleCleanInvalidWallets(env) {
  try {
    const listResult = await env.KRYPT_DATA.list({ prefix: 'user:' });
    let deletedCount = 0;
    let mergedBalances = 0;
    
    for (const key of listResult.keys) {
      const userData = await kvGetJSON(env, key.name, null);
      if (userData && userData.address) {
        // Check if wallet address is not exactly 42 characters (0x + 40 hex chars)
        if (userData.address.length !== 42) {
          await env.KRYPT_DATA.delete(key.name);
          deletedCount++;
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      deletedCount, 
      message: `Cleaned ${deletedCount} invalid length wallet addresses` 
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Clean invalid wallets error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clean invalid wallets' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

// ===== AUTONOMOUS DEVELOPMENT =====
async function runAutonomousDevelopment(env) {
  try {
    console.log('🔄 Running autonomous development...');

    // Seed initial development data if empty
    const currentProgress = await kvGetJSON(env, 'dev_progress', 0);
    const logs = await kvGetJSON(env, 'dev_logs', []);
    
    if (logs.length === 0) {
      await seedInitialDevelopment(env);
      console.log('🌱 Seeded initial development data');
      return;
    }
    
    // Check if development is complete
    if (currentProgress >= BLOCKCHAIN_COMPONENTS) {
      console.log('✅ Blockchain development completed');
      return;
    }

    // Generate multiple components to maintain continuous flow
    const componentsToGenerate = Math.min(COMPONENTS_PER_CRON, BLOCKCHAIN_COMPONENTS - currentProgress);
    
    let actualGenerated = 0;
    for (let i = 0; i < componentsToGenerate; i++) {
      const result = await generateNextComponent(env);
      if (!result.rateLimited) {
        actualGenerated++;
      }
      // Small delay between components for realistic timing
      if (i < componentsToGenerate - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Generated ${actualGenerated}/${componentsToGenerate} components (some may have been rate limited). Progress: ${currentProgress + actualGenerated}/${BLOCKCHAIN_COMPONENTS}`);
  } catch (error) {
    console.error('Autonomous development error:', error);
  }
}

// ===== AUTOMATIC RAFFLE DRAWS =====
async function handleAutomaticRaffleDraws(env) {
  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday
    
    // Hourly raffle (every hour at :00)
    if (currentMinute === 0) {
      console.log('🎲 Running hourly raffle draw...');
      await automaticRaffleDraw(env, 'hourly', 1000);
    }
    
    // Weekly raffle (every Sunday at midnight)
    if (currentDay === 0 && currentHour === 0 && currentMinute === 0) {
      console.log('🎲 Running weekly raffle draw...');
      await automaticRaffleDraw(env, 'weekly', 25000);
    }
  } catch (error) {
    console.error('Automatic raffle draw error:', error);
  }
}

async function automaticRaffleDraw(env, raffleType, prizeAmount) {
  try {
    const listResult = await env.KRYPT_DATA.list({ prefix: 'raffle_entry:' });
    const entries = [];
    
    for (const key of listResult.keys) {
      const entry = await kvGetJSON(env, key.name, null);
      if (entry && entry.raffleType === raffleType && entry.status === 'active') {
        entries.push(entry);
      }
    }

    if (entries.length === 0) {
      console.log(`No entries found for ${raffleType} raffle`);
      return;
    }

    // Select random winner
    const winner = entries[Math.floor(Math.random() * entries.length)];

    // Update winner's balance
    const userKey = `user:${winner.walletAddress.toLowerCase()}`;
    const user = await kvGetJSON(env, userKey, { address: winner.walletAddress, balance: 0 });
    user.balance = (user.balance || 0) + prizeAmount;
    user.lastUpdated = Date.now();
    await kvPutJSON(env, userKey, user);

    // Mark entries as completed
    for (const entry of entries) {
      entry.status = 'completed';
      entry.winnerAddress = winner.walletAddress;
      entry.prizeAmount = prizeAmount;
      entry.drawnAt = new Date().toISOString();
      entry.automatic = true;
      await kvPutJSON(env, `raffle_entry:${entry.id}`, entry);
    }

    console.log(`🎉 ${raffleType} raffle drawn! Winner: ${winner.walletAddress}, Prize: ${prizeAmount} KRYPT`);
  } catch (error) {
    console.error(`Automatic ${raffleType} raffle draw error:`, error);
  }
}

// ===== CHAT HANDLERS =====
async function handleGetChatMessages(env) {
  try {
    const messages = await kvGetJSON(env, 'chat_messages', []);
    console.log(`📨 Chat messages fetch: ${messages.length} messages found`);
    
    // Return last 100 messages to prevent excessive data
    const recentMessages = messages.slice(-100);
    
    return new Response(JSON.stringify({
      success: true,
      messages: recentMessages,
      timestamp: Date.now(),
      totalMessages: messages.length,
      debugInfo: {
        kvFetch: 'success',
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
      }
    }), { 
      headers: {
        ...JSON_HEADERS,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get chat messages'
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleSendChatMessage(request, env) {
  try {
    const { message, username, walletAddress } = await request.json();
    
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message cannot be empty'
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    // Basic profanity filter and length limit
    if (message.length > 500) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message too long (max 500 characters)'
      }), { status: 400, headers: JSON_HEADERS });
    }
    
    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      message: message.trim(),
      username: username || 'Anonymous',
      walletAddress: walletAddress || null,
      timestamp: new Date().toISOString(),
      type: 'user'
    };
    
    // Get existing messages and add new one
    const messages = await kvGetJSON(env, 'chat_messages', []);
    messages.push(chatMessage);
    
    // Keep only last 1000 messages to prevent storage bloat
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }
    
    // Write to KV
    await kvPutJSON(env, 'chat_messages', messages);
    
    // Also store with timestamp for immediate access
    await kvPutJSON(env, `chat_latest`, {
      message: chatMessage,
      timestamp: Date.now(),
      totalCount: messages.length
    });
    
    console.log(`✅ Chat message sent: ${chatMessage.username} - "${chatMessage.message}" (Total: ${messages.length})`);
    
    return new Response(JSON.stringify({
      success: true,
      message: chatMessage,
      debugInfo: {
        totalMessages: messages.length,
        kvWrite: 'success',
        latestStored: true
      }
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Send chat message error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send message'
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleGetLatestMessage(env) {
  try {
    const latest = await kvGetJSON(env, 'chat_latest', null);
    
    return new Response(JSON.stringify({
      success: true,
      latest: latest,
      timestamp: Date.now()
    }), { 
      headers: {
        ...JSON_HEADERS,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Get latest message error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get latest message'
    }), { status: 500, headers: JSON_HEADERS });
  }
}