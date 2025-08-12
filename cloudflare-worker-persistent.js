// Persistent Cloudflare Worker - KV-based (no in-memory caches)
// Handles development progress, logs, and terminal code with persistence across deployments

// Global headers (consistent CORS)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const JSON_HEADERS = { 
  ...CORS_HEADERS, 
  "Content-Type": "application/json; charset=utf-8" 
};

// KV helpers
async function kvGetJSON(env, key, fallback = null) {
  try {
    const raw = await env.KRYPT_DATA.get(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`KV get error for key ${key}:`, error);
    return fallback;
  }
}

async function kvPutJSON(env, key, value) {
  try {
    await env.KRYPT_DATA.put(key, JSON.stringify(value));
  } catch (error) {
    console.error(`KV put error for key ${key}:`, error);
    throw error;
  }
}

// ===== PROGRESS HANDLERS =====
async function handleGetProgress(env) {
  const raw = await env.KRYPT_DATA.get("dev_progress");
  const componentsCompleted = raw ? Number(raw) : 0;
  
  // Calculate derived values
  const totalComponents = 4500;
  const percentComplete = (componentsCompleted / totalComponents) * 100;
  const currentPhase = Math.floor(componentsCompleted / 1125) + 1; // 4 phases
  const phaseProgress = ((componentsCompleted % 1125) / 1125) * 100;
  
  const progress = {
    currentPhase: Math.min(currentPhase, 4),
    componentsCompleted,
    totalComponents,
    percentComplete,
    phaseProgress: Math.min(phaseProgress, 100),
    linesOfCode: componentsCompleted * 80, // approximate
    commits: componentsCompleted,
    testsRun: Math.floor(componentsCompleted / 10),
    lastUpdated: Date.now()
  };
  
  return new Response(JSON.stringify(progress), { headers: JSON_HEADERS });
}

async function handleSetProgress(env, request) {
  const { progress } = await request.json();
  
  if (!Number.isFinite(progress) || progress < 0 || progress > 4500) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "invalid progress - must be 0-4500" 
    }), { 
      status: 400, 
      headers: JSON_HEADERS 
    });
  }
  
  await env.KRYPT_DATA.put("dev_progress", String(progress));
  console.log(`✅ Progress updated to: ${progress}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    progress 
  }), { headers: JSON_HEADERS });
}

// ===== LOGS HANDLERS =====
async function handleGetLogs(env) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  
  const logs = await kvGetJSON(env, "dev_logs", []);
  const recentLogs = logs.slice(-limit);
  
  console.log(`📝 Returning ${recentLogs.length} logs (requested ${limit})`);
  return new Response(JSON.stringify(recentLogs), { headers: JSON_HEADERS });
}

async function handleAddLog(env, request) {
  const body = await request.json();
  const { message, type, details } = body;
  
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    timestamp: new Date().toISOString(),
    type: type || "code",
    message: String(message || ""),
    details: details || {}
  };
  
  const logs = await kvGetJSON(env, "dev_logs", []);
  logs.push(entry);
  
  // Keep last 200 logs
  if (logs.length > 200) {
    logs.splice(0, logs.length - 200);
  }
  
  await kvPutJSON(env, "dev_logs", logs);
  console.log(`📝 Added log: ${entry.message}`);
  
  return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
}

// ===== CODE BLOCKS HANDLERS =====
async function handleGetCode(env) {
  const blocks = await kvGetJSON(env, "dev_code", []);
  // Return latest 20 blocks, newest first
  return new Response(JSON.stringify({ 
    blocks: blocks.slice(-20).reverse() 
  }), { headers: JSON_HEADERS });
}

async function handleAddCode(env, request) {
  const { block } = await request.json();
  const codeBlocks = await kvGetJSON(env, "dev_code", []);
  
  codeBlocks.push(String(block || ""));
  
  // Keep last 50 code blocks
  if (codeBlocks.length > 50) {
    codeBlocks.splice(0, codeBlocks.length - 50);
  }
  
  await kvPutJSON(env, "dev_code", codeBlocks);
  console.log(`💻 Added code block: ${block.substring(0, 50)}...`);
  
  return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
}

// ===== AUTO DEVELOPMENT SIMULATION =====
async function simulateDevelopment(env) {
  try {
    const raw = await env.KRYPT_DATA.get("dev_progress");
    const currentProgress = raw ? Number(raw) : 0;
    
    if (currentProgress >= 4500) {
      console.log("🎉 Development complete!");
      return;
    }
    
    // Increment progress
    const newProgress = currentProgress + 1;
    await env.KRYPT_DATA.put("dev_progress", String(newProgress));
    
    // Generate component name
    const componentTypes = [
      "BlockStructure", "TransactionPool", "CryptographicHash", "MerkleTree", 
      "BlockValidator", "DigitalSignature", "ConsensusRules", "NetworkProtocol",
      "SmartContract", "VirtualMachine", "StateManager", "AccountModel"
    ];
    const componentType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
    const componentName = `${componentType}_${newProgress}`;
    const linesGenerated = 78 + Math.floor(Math.random() * 40);
    
    // Add development log
    const codeLog = {
      id: `component-${newProgress}-dev`,
      timestamp: new Date().toISOString(),
      type: "code",
      message: `✅ ${componentName} developed (${linesGenerated} lines)`,
      details: {
        componentName,
        linesGenerated,
        phase: Math.floor(newProgress / 1125) + 1,
        code: generateCodeSnippet(componentName, linesGenerated)
      }
    };
    
    // Add commit log every component
    const commitLog = {
      id: `component-${newProgress}-commit`,
      timestamp: new Date(Date.now() + 1000).toISOString(),
      type: "commit",
      message: `📦 Committed ${componentName} to krypt-blockchain repo`,
      details: {
        commits: newProgress,
        componentName
      }
    };
    
    // Update logs
    const logs = await kvGetJSON(env, "dev_logs", []);
    logs.push(codeLog, commitLog);
    
    if (logs.length > 200) {
      logs.splice(0, logs.length - 200);
    }
    
    await kvPutJSON(env, "dev_logs", logs);
    
    console.log(`🚀 Development: ${newProgress}/4500 - ${componentName}`);
    
  } catch (error) {
    console.error("❌ Development simulation error:", error);
  }
}

function generateCodeSnippet(componentName, lines) {
  return `export class ${componentName} {
  constructor(data: any) {
    this.validate(data)
  }

  private validate(data: any): boolean {
    // Implementation details...
    return true
  }

  public async process(): Promise<void> {
    // ${lines} lines of production-ready code
  }
}`;
}

// ===== VISITOR TRACKING (simplified) =====
async function handleVisitorCount(env) {
  const count = await kvGetJSON(env, "visitor_count", 0);
  return new Response(JSON.stringify({ count }), { headers: JSON_HEADERS });
}

// ===== MAIN ROUTER =====
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    try {
      // Development Progress Routes
      if (url.pathname === "/api/progress" && request.method === "GET") {
        return await handleGetProgress(env);
      }
      if (url.pathname === "/api/progress" && request.method === "POST") {
        return await handleSetProgress(env, request);
      }
      
      // Development Logs Routes  
      if (url.pathname === "/api/logs" && request.method === "GET") {
        return await handleGetLogs(env);
      }
      if (url.pathname === "/api/logs" && request.method === "POST") {
        return await handleAddLog(env, request);
      }
      
      // Code Blocks Routes
      if (url.pathname === "/api/code" && request.method === "GET") {
        return await handleGetCode(env);
      }
      if (url.pathname === "/api/code" && request.method === "POST") {
        return await handleAddCode(env, request);
      }
      
      // Stats Route (simplified)
      if (url.pathname === "/api/stats" && request.method === "GET") {
        const progress = await env.KRYPT_DATA.get("dev_progress");
        const componentsCompleted = progress ? Number(progress) : 0;
        
        const stats = {
          total_users: { value: 1, lastUpdated: new Date().toISOString() },
          early_access_users: { value: 1, lastUpdated: new Date().toISOString() },
          total_lines_of_code: { value: componentsCompleted * 80, lastUpdated: new Date().toISOString() },
          total_commits: { value: componentsCompleted, lastUpdated: new Date().toISOString() },
          total_tests_run: { value: Math.floor(componentsCompleted / 10), lastUpdated: new Date().toISOString() },
          components_completed: { value: componentsCompleted, lastUpdated: new Date().toISOString() },
          current_phase: { value: Math.floor(componentsCompleted / 1125) + 1, lastUpdated: new Date().toISOString() }
        };
        
        return new Response(JSON.stringify(stats), { headers: JSON_HEADERS });
      }
      
      // Visitor count
      if (url.pathname === "/api/early-access/count" && request.method === "GET") {
        return await handleVisitorCount(env);
      }
      
      return new Response("Not Found", { status: 404 });
      
    } catch (error) {
      console.error("❌ Worker error:", error);
      return new Response(JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }), { 
        status: 500, 
        headers: JSON_HEADERS 
      });
    }
  },
  
  // Scheduled task for development simulation
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(simulateDevelopment(env));
  }
}