import { useState } from 'react'

export default function Roadmap() {
  const [activePhase, setActivePhase] = useState(0)

  const phases = [
    {
      title: 'Phase 1: Foundation',
      status: 'in-progress',
      items: [
        { text: 'Launch Krypt Terminal platform', completed: true },
        { text: 'Deploy initial AI capabilities', completed: true },
        { text: 'Begin blockchain development', completed: true },
        { text: 'Community building', completed: false },
        { text: 'Token launch', completed: false },
      ],
    },
    {
      title: 'Phase 2: Expansion',
      status: 'upcoming',
      items: [
        { text: 'Advanced wallet analysis features', completed: false },
        { text: 'Trading bot integration', completed: false },
        { text: 'Mobile app development', completed: false },
        { text: 'Partnership announcements', completed: false },
        { text: 'First airdrop distribution', completed: false },
      ],
    },
    {
      title: 'Phase 3: Innovation',
      status: 'upcoming',
      items: [
        { text: 'Blockchain testnet launch', completed: false },
        { text: 'Smart contract deployment', completed: false },
        { text: 'DEX integration', completed: false },
        { text: 'Cross-chain capabilities', completed: false },
        { text: 'Governance implementation', completed: false },
      ],
    },
    {
      title: 'Phase 4: Dominance',
      status: 'upcoming',
      items: [
        { text: 'Mainnet launch', completed: false },
        { text: 'Full ecosystem deployment', completed: false },
        { text: 'Major exchange listings', completed: false },
        { text: 'Global adoption campaign', completed: false },
        { text: 'Decentralized autonomous operation', completed: false },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-terminal-green mb-4">
            Development Roadmap
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Track the journey from initial AI development to full blockchain ecosystem deployment
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-terminal-gray/20 rounded-lg p-1 flex flex-wrap gap-1">
            {phases.map((phase, index) => (
              <button
                key={index}
                onClick={() => setActivePhase(index)}
                className={`px-4 py-2 rounded-md transition-all ${
                  activePhase === index 
                    ? 'bg-terminal-green text-black font-semibold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {phase.title}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Details */}
        <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-terminal-green mb-4">
            {phases[activePhase].title} Details
          </h2>
        
        <div className="space-y-3">
          {phases[activePhase].items.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-4 h-4 border-2 rounded ${
                item.completed 
                  ? 'border-orange-400 bg-orange-400' 
                  : 'border-orange-500/50'
              }`}>
                {item.completed && (
                  <svg className="w-full h-full text-terminal-bg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`${
                item.completed 
                  ? 'text-terminal-green' 
                  : 'text-terminal-green/60'
              }`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-terminal-green/30">
          <div className="text-sm text-terminal-green/70">
            <p>Estimated Timeline: Q3 2025 - Q2 2026</p>
            <p className="mt-2">
              Our roadmap is dynamic and will evolve based on community feedback 
              and technological advancements.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="terminal-window">
          <h3 className="text-lg text-terminal-green mb-2">Current Focus</h3>
          <p className="text-sm text-terminal-green/70">
            Building core infrastructure and establishing community presence
          </p>
        </div>
        
        <div className="terminal-window">
          <h3 className="text-lg text-terminal-green mb-2">Next Milestone</h3>
          <p className="text-sm text-terminal-green/70">
            Token launch and first airdrop distribution to early supporters
          </p>
        </div>
        
        <div className="terminal-window">
          <h3 className="text-lg text-terminal-green mb-2">Long-term Vision</h3>
          <p className="text-sm text-terminal-green/70">
            Fully autonomous blockchain ecosystem powered by AI
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}