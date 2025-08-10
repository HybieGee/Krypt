export default function Documentation() {
  return (
    <div className="terminal-window max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-terminal-green mb-6">
        Krypt Terminal Documentation
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl text-terminal-green mb-3">Overview</h2>
          <p className="text-terminal-green/80 leading-relaxed">
            Krypt Terminal is an advanced AI-powered platform for Web3 development. 
            Our autonomous AI agent is actively building a next-generation blockchain 
            infrastructure with 640 components across 4 critical phases.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-terminal-green/90 mb-2">Krypt Chat</h3>
              <ul className="list-disc list-inside space-y-1 text-terminal-green/70 ml-4">
                <li>AI-powered assistance for memecoin trading</li>
                <li>Advanced wallet research and analysis</li>
                <li>Real-time market insights</li>
                <li>Personalized trading strategies</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg text-terminal-green/90 mb-2">Blockchain Development</h3>
              <ul className="list-disc list-inside space-y-1 text-terminal-green/70 ml-4">
                <li>640 components being developed autonomously</li>
                <li>4 development phases: Infrastructure, Consensus, Smart Contracts, Network</li>
                <li>Real-time progress tracking</li>
                <li>Automatic deployment upon completion</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg text-terminal-green/90 mb-2">Rewards System</h3>
              <ul className="list-disc list-inside space-y-1 text-terminal-green/70 ml-4">
                <li>Earn credits for platform usage</li>
                <li>Raffle tickets for token giveaways</li>
                <li>Early access benefits</li>
                <li>Airdrop eligibility</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2 text-terminal-green/70 ml-4">
            <li>Connect your wallet to access full features</li>
            <li>Use Krypt Chat for AI assistance</li>
            <li>Monitor blockchain development progress</li>
            <li>Earn credits through active participation</li>
            <li>Stay updated with development logs</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl text-terminal-green mb-3">API Reference</h2>
          <div className="bg-black/50 p-4 rounded border border-terminal-green/30">
            <pre className="text-terminal-green/80 text-sm">
{`// WebSocket Events
socket.emit('chat:message', { message: string })
socket.on('chat:response', { message: string })

// REST Endpoints
GET  /api/stats
GET  /api/blockchain/progress
POST /api/chat`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}