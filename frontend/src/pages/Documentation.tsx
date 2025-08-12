export default function Documentation() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-terminal-green mb-4">
            Krypt Terminal Documentation
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete guide to understanding Krypt Terminal's AI blockchain development platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Transparency */}
          <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-terminal-green mb-4">🔍 Platform Transparency</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              <strong>Krypt Terminal is 100% transparent and verifiable.</strong> Our AI agent uses Claude AI 
              technology to develop actual blockchain code, with every step visible to users in real-time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">✅ What's Real</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Live AI development system (Claude AI)</li>
                  <li>• Real TypeScript blockchain code generation</li>
                  <li>• Actual development progress tracking</li>
                  <li>• Real user wallet tracking & leaderboard</li>
                  <li>• Authentic milestone reward distribution</li>
                </ul>
              </div>
              <div>
                <h4 className="text-terminal-green font-semibold mb-2">🚫 No Fake Data</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• No simulated users or fake visitors</li>
                  <li>• No mock development logs or progress</li>
                  <li>• Zero phantom wallet balances</li>
                  <li>• All statistics update globally</li>
                  <li>• Authentic user interactions only</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Security Section */}
          <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-terminal-green mb-4">🔒 Data Security & Verification</h2>
            <h4 className="text-terminal-green font-semibold mb-3">Safe Storage Verification</h4>
            <div className="space-y-4">
              <div className="bg-black/50 p-4 rounded">
                <h5 className="text-terminal-green font-semibold mb-2">📝 Verification Method</h5>
                <p className="text-gray-300 text-sm mb-3">
                  All user data is stored securely with verification hashes. You can verify your data integrity at any time:
                </p>
                <div className="bg-gray-800 p-3 rounded border border-terminal-green/30">
                  <code className="text-terminal-green text-xs font-mono">
                    // Your wallet verification hash<br/>
                    SHA256(walletAddress + balance + timestamp)<br/>
                    → Ensures data hasn't been tampered with
                  </code>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-terminal-green font-semibold mb-2">🔐 What We Store</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Auto-generated wallet addresses</li>
                    <li>• Token balances (KRYPT only)</li>
                    <li>• Mining activity status</li>
                    <li>• Raffle entries and tickets</li>
                    <li>• Milestone achievement records</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-terminal-green font-semibold mb-2">🛡️ What We DON'T Store</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• No private keys or seed phrases</li>
                    <li>• No personal information</li>
                    <li>• No real cryptocurrency data</li>
                    <li>• No email or contact details</li>
                    <li>• No tracking beyond this platform</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-terminal-green mb-4">🛠 How It Works</h2>
            <div className="space-y-4">
              <div className="bg-black/50 p-4 rounded">
                <h3 className="text-terminal-green font-semibold mb-2">AI Development Process</h3>
                <div className="text-gray-300 space-y-2">
                  <div className="flex items-start space-x-3">
                    <span className="text-terminal-green font-mono text-sm">1.</span>
                    <span>Krypt analyzes blockchain architecture requirements</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-terminal-green font-mono text-sm">2.</span>
                    <span>Sends request to Claude AI for code generation</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-terminal-green font-mono text-sm">3.</span>
                    <span>Reviews and integrates generated blockchain components</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-terminal-green font-mono text-sm">4.</span>
                    <span>Updates progress and logs in real-time</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-terminal-green font-mono text-sm">5.</span>
                    <span>Commits code to development repository</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Status */}
          <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-terminal-green mb-4">📈 Platform Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-4 rounded text-center">
                <div className="text-terminal-green text-lg font-bold">✅ PRODUCTION</div>
                <div className="text-gray-400 text-sm">Global Edge Network</div>
              </div>
              <div className="bg-black/50 p-4 rounded text-center">
                <div className="text-terminal-green text-lg font-bold">🤖 AI ACTIVE</div>
                <div className="text-gray-400 text-sm">Development Engine</div>
              </div>
              <div className="bg-black/50 p-4 rounded text-center">
                <div className="text-terminal-green text-lg font-bold">🔒 SECURE</div>
                <div className="text-gray-400 text-sm">Data Protection</div>
              </div>
              <div className="bg-black/50 p-4 rounded text-center">
                <div className="text-terminal-green text-lg font-bold">⚡ FAST</div>
                <div className="text-gray-400 text-sm">Real-time Updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}