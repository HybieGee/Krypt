export default function Documentation() {
  return (
    <div className="terminal-window max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-terminal-green mb-6">
        Krypt Terminal Documentation
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl text-terminal-green mb-3">🔍 Platform Transparency</h2>
          <div className="bg-terminal-green/5 border border-terminal-green/30 p-4 rounded mb-4">
            <p className="text-terminal-green/80 leading-relaxed mb-3">
              <strong>Krypt Terminal is 100% transparent and verifiable.</strong> Our AI agent uses real Claude API 
              calls to develop actual blockchain code, with every step visible to users.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">✅ What's Real</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• Live Claude API integration</li>
                  <li>• Real TypeScript code generation</li>
                  <li>• Actual development progress tracking</li>
                  <li>• Live user balance & leaderboard</li>
                </ul>
              </div>
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">🚫 No Fake Data</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• No simulated users or holders</li>
                  <li>• No mock development logs</li>
                  <li>• Development halts without API key</li>
                  <li>• All statistics are real-time</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">🛠 How It Works</h2>
          <div className="space-y-4">
            <div className="border border-terminal-green/30 p-4 rounded">
              <h3 className="text-lg text-terminal-green/90 mb-2">AI Development Process</h3>
              <div className="text-terminal-green/70 space-y-2">
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">1.</span>
                  <span>Krypt analyzes blockchain architecture requirements</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">2.</span>
                  <span>Sends request to Claude API (claude-3-haiku-20240307)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">3.</span>
                  <span>Receives production-ready TypeScript code</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">4.</span>
                  <span>Commits code to krypt-blockchain repository</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">5.</span>
                  <span>Updates progress tracking and runs tests</span>
                </div>
              </div>
            </div>

            <div className="border border-terminal-green/30 p-4 rounded">
              <h3 className="text-lg text-terminal-green/90 mb-2">4 Development Phases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-blue-400 font-semibold">Phase 1: Core Infrastructure</div>
                  <div className="text-terminal-green/60 text-sm">Block structure, transactions, hashing, merkle trees</div>
                </div>
                <div>
                  <div className="text-blue-400 font-semibold">Phase 2: Consensus Mechanism</div>
                  <div className="text-terminal-green/60 text-sm">Proof-of-stake, validators, network consensus</div>
                </div>
                <div>
                  <div className="text-blue-400 font-semibold">Phase 3: Smart Contract Layer</div>
                  <div className="text-terminal-green/60 text-sm">Contract execution, gas system, state management</div>
                </div>
                <div>
                  <div className="text-blue-400 font-semibold">Phase 4: Network & Security</div>
                  <div className="text-terminal-green/60 text-sm">P2P networking, security protocols, deployment</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">📊 Verification Methods</h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
              <h4 className="text-terminal-green font-semibold mb-3">Real-Time Verification</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Live Terminal View</div>
                  <div className="text-terminal-green/70">Watch real API requests and responses in the development terminal</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Development Logs</div>
                  <div className="text-terminal-green/70">Filter and inspect all generated code, commits, and test results</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Progress Statistics</div>
                  <div className="text-terminal-green/70">Monitor lines of code, commits, and tests in real-time</div>
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
              <h4 className="text-terminal-green font-semibold mb-3">API Endpoints (Public Access)</h4>
              <pre className="text-terminal-green/80 text-xs overflow-x-auto">
{`GET  /api/progress          - Live development progress
GET  /api/logs              - All development logs  
GET  /api/stats             - Real-time statistics
GET  /api/leaderboard       - Live user rankings
POST /api/user/balance      - Update user balance
GET  /api/health            - API status check`}
              </pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">🔐 Security & Trust</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-terminal-green/30 p-4 rounded">
              <h4 className="text-terminal-green font-semibold mb-3">Code Generation Security</h4>
              <ul className="text-terminal-green/70 text-sm space-y-1">
                <li>• All code generated by Claude AI is production-ready</li>
                <li>• TypeScript with proper error handling</li>
                <li>• Security best practices enforced</li>
                <li>• No malicious code generation possible</li>
              </ul>
            </div>
            <div className="border border-terminal-green/30 p-4 rounded">
              <h4 className="text-terminal-green font-semibold mb-3">User Data Protection</h4>
              <ul className="text-terminal-green/70 text-sm space-y-1">
                <li>• No sensitive data stored permanently</li>
                <li>• Wallet addresses for balance tracking only</li>
                <li>• All user interactions are transparent</li>
                <li>• No hidden processes or backdoors</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">🎯 Token System</h2>
          <div className="border border-terminal-green/30 p-4 rounded">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">Free Minting</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• Up to 1000 tokens per user</li>
                  <li>• No payment required</li>
                  <li>• Instant to wallet</li>
                </ul>
              </div>
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">Mining System</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• 1-6 tokens every 5 seconds</li>
                  <li>• Works globally across pages</li>
                  <li>• Toggle on/off anytime</li>
                </ul>
              </div>
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">Staking Rewards</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• 1% daily returns</li>
                  <li>• Multiple duration options</li>
                  <li>• Compound earnings</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">📈 Platform Status</h2>
          <div className="bg-terminal-green/5 border border-terminal-green/30 p-4 rounded">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ LIVE</div>
                <div className="text-terminal-green/60 text-sm">AI Development</div>
              </div>
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ ACTIVE</div>
                <div className="text-terminal-green/60 text-sm">Token System</div>
              </div>
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ REAL-TIME</div>
                <div className="text-terminal-green/60 text-sm">Leaderboard</div>
              </div>
              <div>
                <div className="text-yellow-400 text-lg font-bold">🚧 COMING</div>
                <div className="text-terminal-green/60 text-sm">Chat Interface</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}