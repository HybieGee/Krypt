import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function Tokenomics() {
  const { blockchainProgress } = useStore()
  const [activeSection, setActiveSection] = useState('overview')

  const tokenDistribution = [
    { label: 'Community Pool', amount: 970000000, percentage: 97, color: 'bg-terminal-green' },
    { label: 'Development Fund', amount: 30000000, percentage: 3, color: 'bg-red-400' }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-terminal-green mb-4">
            KRYPT Memecoin Tokenomics
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Supporting the development of the world's first AI-built blockchain through community participation
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-terminal-gray/20 rounded-lg p-1 flex space-x-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'distribution', label: 'Distribution' },
              { id: 'utility', label: 'Utility' },
              { id: 'development', label: 'Dev Fund' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeSection === tab.id 
                    ? 'bg-terminal-green text-black font-semibold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* About Krypt */}
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-terminal-green mb-4">About Krypt</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Krypt represents the next evolution in blockchain technology - an AI agent that autonomously 
                  develops its own blockchain infrastructure from the ground up. Unlike traditional projects 
                  that rely on human developers, Krypt leverages advanced AI to continuously build, test, 
                  and deploy blockchain components.
                </p>
                <p>
                  What sets Krypt apart is its revolutionary approach to self-improving blockchain architecture. 
                  The AI continuously analyzes market needs, security requirements, and performance metrics 
                  to evolve the blockchain in real-time, creating a truly adaptive and future-proof platform.
                </p>
                <div className="bg-black/50 p-4 rounded border-l-4 border-terminal-green">
                  <h3 className="font-semibold text-terminal-green mb-2">Innovation Leadership</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• First AI-developed blockchain with autonomous decision making</li>
                    <li>• Real-time adaptive consensus mechanisms</li>
                    <li>• Self-optimizing smart contract execution</li>
                    <li>• Continuous security enhancement through AI analysis</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Token Stats */}
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-terminal-green mb-4">Token Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded">
                  <h3 className="text-terminal-green font-semibold">Total Supply</h3>
                  <p className="text-2xl font-bold">1,000,000,000</p>
                  <p className="text-sm text-gray-400">KRYPT Tokens</p>
                </div>
                <div className="bg-black/50 p-4 rounded">
                  <h3 className="text-terminal-green font-semibold">Development Progress</h3>
                  <p className="text-2xl font-bold">{blockchainProgress?.completedComponents || 0}</p>
                  <p className="text-sm text-gray-400">Components Built</p>
                </div>
                <div className="bg-black/50 p-4 rounded">
                  <h3 className="text-terminal-green font-semibold">Current Phase</h3>
                  <p className="text-2xl font-bold">{blockchainProgress?.currentPhase || 1}</p>
                  <p className="text-sm text-gray-400">of 4 Phases</p>
                </div>
                <div className="bg-black/50 p-4 rounded">
                  <h3 className="text-terminal-green font-semibold">Lines of Code</h3>
                  <p className="text-2xl font-bold">{blockchainProgress?.linesOfCode?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-400">AI Generated</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'distribution' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-terminal-green mb-6 text-center">Token Distribution</h2>
              
              {/* Pie Chart Visualization */}
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-80 h-80 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {tokenDistribution.map((segment, index) => {
                      const previousPercentages = tokenDistribution.slice(0, index).reduce((sum, s) => sum + s.percentage, 0)
                      const circumference = 2 * Math.PI * 30
                      const strokeDasharray = (segment.percentage / 100) * circumference
                      const strokeDashoffset = circumference - (previousPercentages / 100) * circumference
                      
                      return (
                        <circle
                          key={segment.label}
                          cx="50"
                          cy="50"
                          r="30"
                          fill="transparent"
                          stroke={segment.color.replace('bg-', '')}
                          strokeWidth="8"
                          strokeDasharray={`${strokeDasharray} ${circumference}`}
                          strokeDashoffset={-strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-width-10"
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-terminal-green">1B</div>
                      <div className="text-sm text-gray-400">Total Supply</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {tokenDistribution.map((segment) => (
                    <div key={segment.label} className="flex items-center justify-between p-4 bg-black/50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${segment.color}`}></div>
                        <span className="font-medium">{segment.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{segment.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">{segment.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'utility' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-terminal-green mb-6">Token Utility</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/50 p-6 rounded border border-terminal-green/10">
                  <h3 className="text-xl font-semibold text-terminal-green mb-3">Governance</h3>
                  <p className="text-gray-300 mb-4">
                    Token holders vote on critical decisions affecting the AI's development direction, 
                    consensus mechanisms, and protocol upgrades.
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Protocol parameter adjustments</li>
                    <li>• AI training data selection</li>
                    <li>• Development milestone priorities</li>
                  </ul>
                </div>

                <div className="bg-black/50 p-6 rounded border border-terminal-green/10">
                  <h3 className="text-xl font-semibold text-terminal-green mb-3">Community Rewards</h3>
                  <p className="text-gray-300 mb-4">
                    Participate in the Krypt ecosystem and earn rewards through various community 
                    activities and achievements.
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Development milestone bonuses</li>
                    <li>• Community event participation</li>
                    <li>• Bug reporting and feedback</li>
                  </ul>
                </div>

                <div className="bg-black/50 p-6 rounded border border-terminal-green/10">
                  <h3 className="text-xl font-semibold text-terminal-green mb-3">AI Interaction</h3>
                  <p className="text-gray-300 mb-4">
                    Use tokens to interact with Krypt AI, request custom development features, 
                    and access premium analytics.
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Custom smart contract generation</li>
                    <li>• Priority development requests</li>
                    <li>• Advanced blockchain analytics</li>
                  </ul>
                </div>

                <div className="bg-black/50 p-6 rounded border border-terminal-green/10">
                  <h3 className="text-xl font-semibold text-terminal-green mb-3">Future Blockchain Utility</h3>
                  <p className="text-gray-300 mb-4">
                    Once the Krypt AI blockchain is deployed, KRYPT memecoin holders will receive 
                    utility in the new blockchain ecosystem.
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Potential airdrop for blockchain tokens</li>
                    <li>• Early access to blockchain features</li>
                    <li>• Priority in ecosystem participation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'development' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-terminal-green mb-6">Development Fund</h2>
              
              <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 bg-red-400 rounded"></div>
                  <h3 className="text-xl font-semibold">30,000,000 KRYPT (3%)</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  The development fund is allocated specifically for Krypt's continued innovation and 
                  operational sustainability. This fund ensures the AI can overcome any financial 
                  roadblocks during the blockchain development and deployment phases.
                </p>
                <div className="bg-terminal-green/10 border border-terminal-green/30 rounded p-4 mb-4">
                  <p className="text-terminal-green text-sm">
                    <strong>Note:</strong> Marketing activities (DEX advertising, community growth, partnerships) 
                    are funded separately out of pocket and do not require token allocations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/50 p-6 rounded">
                  <h4 className="text-lg font-semibold text-terminal-green mb-3">Fund Allocation</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex justify-between">
                      <span>Infrastructure Costs</span>
                      <span className="text-terminal-green">40%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>AI Model Training</span>
                      <span className="text-terminal-green">25%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Security Audits</span>
                      <span className="text-terminal-green">20%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Research & Development</span>
                      <span className="text-terminal-green">15%</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-black/50 p-6 rounded">
                  <h4 className="text-lg font-semibold text-terminal-green mb-3">Usage Scenarios</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Cloud computing resources for AI training</li>
                    <li>• Blockchain deployment and hosting costs</li>
                    <li>• Security audits and penetration testing</li>
                    <li>• Emergency bug fixes and patches</li>
                    <li>• Integration with external protocols</li>
                    <li>• Community bounty programs</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">🔒 Community Transparency Commitment</h4>
                <div className="space-y-3 text-gray-300">
                  <p>
                    <strong>No Surprise Sells:</strong> Any use of development funds will be communicated 
                    to the community with full transparency at least 48 hours before execution.
                  </p>
                  <p>
                    <strong>Community Discussion:</strong> Major fund utilizations (&gt;1M KRYPT) will be 
                    subject to community discussion and feedback before implementation.
                  </p>
                  <p>
                    <strong>Public Reporting:</strong> Monthly reports will detail all development fund 
                    usage with blockchain-verifiable transactions.
                  </p>
                  <p>
                    <strong>Emergency Protocols:</strong> Only critical security issues may bypass the 
                    48-hour notice period, with immediate post-action disclosure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}