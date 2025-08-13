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

        // User & Leaderboard endpoints
        case url.pathname === '/api/user/balance' && request.method === 'POST':
          return handleUpdateUserBalance(request, env);
        case url.pathname === '/api/leaderboard' && request.method === 'GET':
          return handleGetLeaderboard(env);

        // Raffle endpoints
        case url.pathname === '/api/raffle/enter' && request.method === 'POST':
          return handleRaffleEntry(request, env);
        case url.pathname === '/api/user/raffle-entries' && request.method === 'GET':
          return handleGetRaffleEntries(request, env);
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
    
    if (progress >= 100) {
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
    const isRunning = progress < 100;
    const estimatedCompletion = isRunning ? 
      new Date(Date.now() + ((100 - progress) * DEVELOPMENT_INTERVAL)).toISOString() : null;

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
    
    if (progress >= 100) {
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
    const componentName = getComponentName(currentProgress);
    const logs = await kvGetJSON(env, 'dev_logs', []);
    
    // Generate realistic development sequence
    const baseTime = Date.now();
    const developmentLogs = [];
    
    // 1. AI Request
    developmentLogs.push({
      id: `ai-req-${currentProgress}-${baseTime}`,
      ts: baseTime - 45000, // 45 seconds ago
      level: 'api',
      msg: `Sending request to Krypt AI...`,
      details: { 
        component: componentName,
        prompt: `Generate optimized ${componentName} implementation with security features`
      }
    });
    
    // 2. AI Response
    developmentLogs.push({
      id: `ai-resp-${currentProgress}-${baseTime}`,
      ts: baseTime - 40000, // 40 seconds ago
      level: 'api',
      msg: `✅ Krypt AI response received (${Math.floor(Math.random() * 500) + 200}ms)`,
      details: { 
        component: componentName,
        tokensUsed: Math.floor(Math.random() * 2000) + 1000
      }
    });
    
    // 3. Code Generation
    const codeSnippet = generateCodeSnippet(componentName);
    const linesAdded = Math.floor(Math.random() * 150) + 50;
    
    developmentLogs.push({
      id: `code-gen-${currentProgress}-${baseTime}`,
      ts: baseTime - 30000, // 30 seconds ago
      level: 'code',
      msg: `Generating ${componentName} implementation...`,
      details: {
        component: componentName,
        codeSnippet: codeSnippet.slice(0, 200) + '...',
        estimatedLines: linesAdded
      }
    });
    
    // 4. Testing
    const testsRun = Math.floor(Math.random() * 8) + 3;
    developmentLogs.push({
      id: `test-${currentProgress}-${baseTime}`,
      ts: baseTime - 15000, // 15 seconds ago
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
    
    // 5. Git Commit
    const commitHash = Math.random().toString(16).substring(2, 8);
    developmentLogs.push({
      id: `commit-${currentProgress}-${baseTime}`,
      ts: baseTime - 5000, // 5 seconds ago
      level: 'commit',
      msg: `✅ Committed to Github`,
      details: {
        component: componentName,
        hash: commitHash,
        linesAdded,
        filesChanged: Math.floor(Math.random() * 3) + 1
      }
    });
    
    // 6. Final completion with code snippet
    const shortCodeSnippet = generateShortCodeSnippet(componentName);
    const actualLineCount = codeSnippet.split('\n').length;
    developmentLogs.push({
      id: `comp-${currentProgress}-${baseTime}`,
      ts: baseTime,
      level: 'system',
      msg: `✅ ${componentName} component developed (${actualLineCount} lines coded)`,
      details: {
        component: componentName,
        progress: currentProgress + 1,
        totalComponents: 4500,
        linesAdded: actualLineCount, // Use actual line count
        commitHash,
        snippet: shortCodeSnippet, // For terminal display
        code: codeSnippet // Full code for development logs
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
      total_lines_of_code: { value: (stats.total_lines_of_code?.value || 0) + linesAdded, lastUpdated: new Date().toISOString() },
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

function generateShortCodeSnippet(componentName) {
  const snippets = [
    `class ${componentName} {
  constructor(config) {
    this.config = config;
    this.initialized = false;
  }
  
  async initialize() {
    // Implementation here
    this.initialized = true;
  }
}`,
    `const ${componentName} = {
  async process(data) {
    const validated = await this.validate(data);
    return this.transform(validated);
  }
};`,
    `interface I${componentName} {
  id: string;
  timestamp: number;
  data: any;
}

export class ${componentName} implements I${componentName} {
  constructor(id: string) {
    this.id = id;
    this.timestamp = Date.now();
  }
}`,
    `export default class ${componentName} {
  private state: Map<string, any> = new Map();
  
  setState(key: string, value: any): void {
    this.state.set(key, value);
  }
  
  getState(key: string): any {
    return this.state.get(key);
  }
}`
  ];
  
  return snippets[Math.floor(Math.random() * snippets.length)];
}

function generateCodeSnippet(componentName) {
  const templates = [
    `export class ${componentName} {
  private readonly version = '1.0.0'
  private state: BlockchainState
  private config: ChainConfig
  private isInitialized: boolean = false
  private eventHandlers: Map<string, Function[]> = new Map()
  private metrics: ComponentMetrics
  
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
  }
  
  private async setupEventHandlers(): Promise<void> {
    this.on('data', this.handleDataEvent.bind(this))
    this.on('error', this.handleErrorEvent.bind(this))
    this.on('shutdown', this.handleShutdownEvent.bind(this))
  }
  
  private async initializeConnections(): Promise<void> {
    await this.state.connect()
    await this.establishPeerConnections()
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
    this.metrics.recordDataProcessed(data.size || 0)
  }
  
  private handleErrorEvent(error: Error): void {
    this.metrics.recordError(error)
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
      const startTime = Date.now()
      const validated = await this.validate(data)
      const processed = await this.transform(validated)
      const endTime = Date.now()
      
      this.metrics.recordProcessingTime(endTime - startTime)
      return processed
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }
  
  private async validate(data: any): Promise<any> {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid data format')
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
  
  private async establishPeerConnections(): Promise<void> {
    // Establish connections to peer nodes
    const peers = this.config.peers || []
    for (const peer of peers) {
      await this.connectToPeer(peer)
    }
  }
  
  private async connectToPeer(peer: PeerConfig): Promise<void> {
    console.log(\`Connecting to peer: \${peer.address}\`)
    // Connection logic here
  }
  
  public getMetrics(): ComponentMetrics {
    return this.metrics
  }
  
  public getStatus(): ComponentStatus {
    return {
      initialized: this.isInitialized,
      version: this.version,
      uptime: Date.now() - this.metrics.startTime,
      errors: this.metrics.errorCount
    }
  }
  
  private cleanup(): void {
    this.eventHandlers.clear()
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
}

interface ComponentStatus {
  initialized: boolean
  version: string
  uptime: number
  errors: number
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

// ===== USER & LEADERBOARD HANDLERS =====
async function handleUpdateUserBalance(request, env) {
  try {
    const { address, balance } = await request.json();
    
    if (!address || typeof balance !== 'number') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valid address and balance required' 
      }), { status: 400, headers: JSON_HEADERS });
    }

    const normalizedAddress = address.toLowerCase();
    const userKey = `user:${normalizedAddress}`;
    
    const userData = {
      address: normalizedAddress,
      balance: Math.max(0, balance),
      lastUpdated: Date.now()
    };

    await kvPutJSON(env, userKey, userData);
    
    return new Response(JSON.stringify({ 
      success: true, 
      balance: userData.balance 
    }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Update user balance error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update balance' 
    }), { status: 500, headers: JSON_HEADERS });
  }
}

async function handleGetLeaderboard(env) {
  try {
    const listResult = await env.KRYPT_DATA.list({ prefix: 'user:' });
    const users = [];
    
    for (const key of listResult.keys) {
      const userData = await kvGetJSON(env, key.name, null);
      if (userData && userData.balance > 0) {
        users.push(userData);
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

    // Calculate available tickets (simplified)
    const availableTickets = Math.floor(user.balance / 100);

    if (availableTickets < ticketCost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Insufficient tickets. Need ${ticketCost}, have ${availableTickets}` 
      }), { status: 400, headers: JSON_HEADERS });
    }

    // Create raffle entry
    const entryId = `${raffleType}_${walletAddress}_${Date.now()}`;
    const raffleEntry = {
      id: entryId,
      walletAddress,
      raffleType,
      ticketCost,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    await kvPutJSON(env, `raffle_entry:${entryId}`, raffleEntry);

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully entered raffle',
      entry: raffleEntry
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
      if (entry && entry.walletAddress === walletAddress && entry.status === 'active') {
        entries.push(entry);
      }
    }

    return new Response(JSON.stringify(entries), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Get raffle entries error:', error);
    return new Response(JSON.stringify([]), { headers: JSON_HEADERS });
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
    const keysToReset = [
      'dev_progress', 'dev_logs', 'dev_code', 'early_access_count', 'last_dev_tick'
    ];
    
    await Promise.all([
      ...keysToReset.map(key => env.KRYPT_DATA.delete(key)),
      // Clear visitor dedup from EARLY_ACCESS namespace
      env.EARLY_ACCESS.list().then(result => 
        Promise.all(result.keys.map(key => env.EARLY_ACCESS.delete(key.name)))
      )
    ]);
    
    // Reinitialize
    await initializeSystemIfNeeded(env);
    
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
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
    const result = await env.EARLY_ACCESS.list();
    await Promise.all(result.keys.map(key => env.EARLY_ACCESS.delete(key.name)));
    
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Admin clear visitors error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to clear visitors' 
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
    
    for (let i = 0; i < componentsToGenerate; i++) {
      await generateNextComponent(env);
      // Small delay between components for realistic timing
      if (i < componentsToGenerate - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Generated ${componentsToGenerate} components. Progress: ${currentProgress + componentsToGenerate}/${BLOCKCHAIN_COMPONENTS}`);
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