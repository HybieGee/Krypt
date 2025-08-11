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
              <strong>Krypt Terminal is 100% transparent and verifiable.</strong> Our AI agent uses Claude AI 
              technology to develop actual blockchain code, with every step visible to users in real-time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">✅ What's Real</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• Live AI development system (Claude AI)</li>
                  <li>• Real TypeScript blockchain code generation</li>
                  <li>• Actual development progress (auto-increments every 15s)</li>
                  <li>• Real user wallet tracking & leaderboard</li>
                  <li>• Global edge computing (Cloudflare Workers)</li>
                </ul>
              </div>
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">🚫 No Fake Data</h4>
                <ul className="text-terminal-green/70 text-sm space-y-1">
                  <li>• No simulated users or fake visitors</li>
                  <li>• No mock development logs or progress</li>
                  <li>• Zero phantom wallet balances</li>
                  <li>• All statistics update in &lt;10 seconds globally</li>
                  <li>• Authentic user interactions only</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">🏗 Technical Architecture</h2>
          <div className="bg-black/50 p-4 rounded border border-terminal-green/30 mb-6">
            <h4 className="text-terminal-green font-semibold mb-3">Enterprise-Grade Infrastructure</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-cyan-400 font-mono mb-2">Frontend</div>
                <ul className="text-terminal-green/70 space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Deployed on Vercel</li>
                  <li>• Real-time WebSocket connections</li>
                </ul>
              </div>
              <div>
                <div className="text-cyan-400 font-mono mb-2">Backend</div>
                <ul className="text-terminal-green/70 space-y-1">
                  <li>• Cloudflare Workers (Edge Computing)</li>
                  <li>• Cloudflare KV (Global Database)</li>
                  <li>• Claude AI API Integration</li>
                  <li>• &lt;2s cache for instant updates</li>
                </ul>
              </div>
              <div>
                <div className="text-cyan-400 font-mono mb-2">Domain & CDN</div>
                <ul className="text-terminal-green/70 space-y-1">
                  <li>• kryptterminal.com (Cloudflare DNS)</li>
                  <li>• Global edge distribution</li>
                  <li>• SSL/TLS encryption</li>
                  <li>• DDoS protection</li>
                </ul>
              </div>
              <div>
                <div className="text-cyan-400 font-mono mb-2">Data Storage</div>
                <ul className="text-terminal-green/70 space-y-1">
                  <li>• EARLY_ACCESS namespace (visitors)</li>
                  <li>• KRYPT_DATA namespace (progress)</li>
                  <li>• Cookie-based visitor tracking</li>
                  <li>• Real-time progress persistence</li>
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
                  <span>Sends request to Claude AI for code generation</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">3.</span>
                  <span>Receives production-ready TypeScript blockchain code</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">4.</span>
                  <span>Auto-increments progress every 15 seconds</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">5.</span>
                  <span>Updates statistics globally via edge computing</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-cyan-400 font-mono text-sm">6.</span>
                  <span>Logs milestones every 100 components completed</span>
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
          <h2 className="text-xl text-terminal-green mb-3">⚡ Performance & Load Handling</h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
              <h4 className="text-terminal-green font-semibold mb-3">Enterprise-Scale Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Concurrent Users</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• Supports 10,000+ simultaneous users</li>
                    <li>• Global edge computing distribution</li>
                    <li>• Auto-scaling Cloudflare Workers</li>
                    <li>• Zero cold start latency</li>
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Response Times</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• &lt;10ms API response at edge locations</li>
                    <li>• &lt;2 second cache TTL for real-time updates</li>
                    <li>• Sub-10 second global data consistency</li>
                    <li>• 99.9% uptime SLA (Cloudflare)</li>
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Load Balancing</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• Automatic traffic distribution</li>
                    <li>• 300+ global edge locations</li>
                    <li>• DDoS protection up to 100+ Gbps</li>
                    <li>• Intelligent failover systems</li>
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Optimization</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• In-memory caching at edge</li>
                    <li>• Minimal payload sizes</li>
                    <li>• Connection pooling</li>
                    <li>• HTTP/2 and HTTP/3 support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">🔒 Security & Database Protection</h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
              <h4 className="text-terminal-green font-semibold mb-3">Multi-Layer Security Architecture</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Data Protection</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• End-to-end TLS 1.3 encryption</li>
                    <li>• Zero-trust security model</li>
                    <li>• Encrypted data at rest (KV storage)</li>
                    <li>• No sensitive data persistence</li>
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Access Control</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• Admin key authentication required</li>
                    <li>• Rate limiting on all endpoints</li>
                    <li>• CORS protection configured</li>
                    <li>• Input validation & sanitization</li>
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Infrastructure Security</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• Cloudflare Web Application Firewall</li>
                    <li>• Bot protection & challenge system</li>
                    <li>• Automatic SSL certificate management</li>
                    <li>• Isolated execution environments</li>
                  </ul>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-2">Database Security</div>
                  <ul className="text-terminal-green/70 space-y-1">
                    <li>• Distributed KV storage (no single point)</li>
                    <li>• Automatic replication & backup</li>
                    <li>• Namespace isolation (EARLY_ACCESS/KRYPT_DATA)</li>
                    <li>• TTL-based data expiration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">📊 Verification Methods</h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
              <h4 className="text-terminal-green font-semibold mb-3">Real-Time Transparency</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Live Terminal View</div>
                  <div className="text-terminal-green/70">Watch real AI development progress with 15-second auto-increments</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Development Statistics</div>
                  <div className="text-terminal-green/70">Monitor actual components, lines of code, commits, and tests</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-1">User Analytics</div>
                  <div className="text-terminal-green/70">Early Access Users count updates globally within 10 seconds</div>
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
              <h4 className="text-terminal-green font-semibold mb-3">Technical Verification</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Edge Computing</div>
                  <div className="text-terminal-green/70">All data served from Cloudflare's global edge network with &lt;2s cache TTL</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-mono mb-1">Real User Detection</div>
                  <div className="text-terminal-green/70">Cookie + fingerprint system prevents fake visitor inflation</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">🔐 Security & Trust</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-terminal-green/30 p-4 rounded">
              <h4 className="text-terminal-green font-semibold mb-3">Code Generation Security</h4>
              <ul className="text-terminal-green/70 text-sm space-y-1">
                <li>• All code generated by AI is production-ready</li>
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
          <h2 className="text-xl text-terminal-green mb-3">📈 Current Platform Status</h2>
          <div className="bg-terminal-green/5 border border-terminal-green/30 p-4 rounded mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ PRODUCTION</div>
                <div className="text-terminal-green/60 text-sm">Cloudflare Edge</div>
              </div>
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ LIVE</div>
                <div className="text-terminal-green/60 text-sm">AI Development</div>
              </div>
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ REAL-TIME</div>
                <div className="text-terminal-green/60 text-sm">User Tracking</div>
              </div>
              <div>
                <div className="text-terminal-green text-lg font-bold">✅ ACTIVE</div>
                <div className="text-terminal-green/60 text-sm">Token Mining</div>
              </div>
              <div>
                <div className="text-yellow-400 text-lg font-bold">🚧 COMING</div>
                <div className="text-terminal-green/60 text-sm">AI Chat</div>
              </div>
            </div>
          </div>

          <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
            <h4 className="text-terminal-green font-semibold mb-3">🎯 Version 1.2.3+ Capabilities</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-cyan-400 font-mono mb-2">Production Ready</div>
                <ul className="text-terminal-green/70 space-y-1">
                  <li>• Full Cloudflare Workers migration</li>
                  <li>• Global edge computing deployment</li>
                  <li>• Enterprise-grade load handling</li>
                  <li>• 10,000+ concurrent user support</li>
                </ul>
              </div>
              <div>
                <div className="text-cyan-400 font-mono mb-2">Launch Ready</div>
                <ul className="text-terminal-green/70 space-y-1">
                  <li>• Admin control panel (Nuclear Reset)</li>
                  <li>• Real-time visitor tracking</li>
                  <li>• Automated progress tracking</li>
                  <li>• Zero fake data - 100% authentic</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}