export default function Roadmap() {
  const phases = [
    {
      title: 'Phase 1: Foundation',
      status: 'in-progress',
      quarter: 'Q4 2024 - Q1 2025',
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
      quarter: 'Q2 2025 - Q3 2025',
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
      quarter: 'Q4 2025 - Q1 2026',
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
      quarter: 'Q2 2026 - Q3 2026',
      items: [
        { text: 'Mainnet launch', completed: false },
        { text: 'Full ecosystem deployment', completed: false },
        { text: 'Major exchange listings', completed: false },
        { text: 'Global adoption campaign', completed: false },
        { text: 'Decentralized autonomous operation', completed: false },
      ],
    },
  ]

  // Calculate overall progress
  const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0)
  const completedItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.completed).length, 0
  )
  const overallProgress = Math.round((completedItems / totalItems) * 100)

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

        {/* Overall Progress */}
        <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-terminal-green">Overall Progress</h2>
            <span className="text-2xl font-bold text-terminal-green">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-terminal-green to-terminal-green/80 transition-all duration-1000"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-400">
            <span>{completedItems} tasks completed</span>
            <span>{totalItems - completedItems} tasks remaining</span>
          </div>
        </div>

        {/* All Phases Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {phases.map((phase, phaseIndex) => (
            <div 
              key={phaseIndex} 
              className={`bg-terminal-gray/10 border rounded-lg p-6 transition-all ${
                phase.status === 'in-progress' 
                  ? 'border-terminal-green shadow-lg shadow-terminal-green/20' 
                  : 'border-terminal-green/20'
              }`}
            >
              {/* Phase Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-2">
                    {phase.title}
                  </h3>
                  <span className="text-sm text-gray-400">{phase.quarter}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  phase.status === 'in-progress' 
                    ? 'bg-terminal-green/20 text-terminal-green' 
                    : 'bg-gray-600/20 text-gray-400'
                }`}>
                  {phase.status === 'in-progress' ? 'IN PROGRESS' : 'UPCOMING'}
                </span>
              </div>

              {/* Phase Items */}
              <div className="space-y-3 mb-4">
                {phase.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 border-2 rounded ${
                      item.completed 
                        ? 'border-terminal-green bg-terminal-green' 
                        : 'border-terminal-green/30'
                    }`}>
                      {item.completed && (
                        <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      item.completed 
                        ? 'text-terminal-green' 
                        : 'text-gray-400'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Phase Progress */}
              <div className="pt-4 border-t border-terminal-green/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Phase Progress</span>
                  <span className="text-xs text-terminal-green font-semibold">
                    {phase.items.filter(item => item.completed).length}/{phase.items.length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      phase.status === 'in-progress'
                        ? 'bg-gradient-to-r from-terminal-green to-terminal-green/80'
                        : 'bg-gray-600'
                    }`}
                    style={{ 
                      width: `${(phase.items.filter(item => item.completed).length / phase.items.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Milestones */}
        <div className="mt-12 bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-terminal-green mb-6 text-center">Key Milestones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/50 p-6 rounded border border-terminal-green/20">
              <div className="text-terminal-green text-2xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-terminal-green mb-2">Current Focus</h3>
              <p className="text-sm text-gray-400">
                Building core infrastructure and establishing community presence
              </p>
            </div>
            
            <div className="bg-black/50 p-6 rounded border border-terminal-green/20">
              <div className="text-terminal-green text-2xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-terminal-green mb-2">Next Milestone</h3>
              <p className="text-sm text-gray-400">
                Token launch and first airdrop distribution to early supporters
              </p>
            </div>
            
            <div className="bg-black/50 p-6 rounded border border-terminal-green/20">
              <div className="text-terminal-green text-2xl mb-3">🌟</div>
              <h3 className="text-lg font-semibold text-terminal-green mb-2">Long-term Vision</h3>
              <p className="text-sm text-gray-400">
                Fully autonomous blockchain ecosystem powered by AI
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Note */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-terminal-gray/10 border border-terminal-green/20 rounded-lg px-6 py-4">
            <p className="text-sm text-gray-400">
              <span className="text-terminal-green font-semibold">Note:</span> Our roadmap is dynamic and will evolve based on community feedback 
              and technological advancements. Timeline estimates are subject to change.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}