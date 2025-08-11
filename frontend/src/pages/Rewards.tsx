import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'

export default function Rewards() {
  const { user, blockchainProgress } = useStore()
  const [activeTab, setActiveTab] = useState<'airdrops' | 'raffles'>('airdrops')
  const [raffleTickets, setRaffleTickets] = useState(0)

  // Calculate airdrop eligibility based on progress and user activity
  const calculateAirdropEligibility = () => {
    const userBalance = user?.balance || 0
    const userStaked = user?.stakes?.reduce((total, stake) => total + stake.amount, 0) || 0
    const userMinted = user?.mintedAmount || 0
    const isMining = user?.isMining || false
    
    return {
      balance: userBalance,
      staked: userStaked,
      minted: userMinted,
      mining: isMining,
      totalScore: userBalance + userStaked + (userMinted * 2) + (isMining ? 100 : 0)
    }
  }

  const eligibility = calculateAirdropEligibility()

  // Airdrop milestones based on blockchain development progress
  const airdropMilestones = [
    {
      id: 1,
      title: "Early Adopter Airdrop",
      description: "Reward for participating during initial development phase",
      requirement: "Join during Phase 1",
      reward: "500 KRYPT tokens",
      progress: blockchainProgress.currentPhase >= 1 ? 100 : 0,
      completed: blockchainProgress.currentPhase >= 1,
      eligible: user?.isEarlyAccess || false
    },
    {
      id: 2,
      title: "Active Participant Airdrop",
      description: "Reward for minting and staking tokens",
      requirement: "Mint 100+ tokens and stake any amount",
      reward: "750 KRYPT tokens",
      progress: Math.min(100, ((eligibility.minted / 100) + (eligibility.staked > 0 ? 1 : 0)) * 50),
      completed: eligibility.minted >= 100 && eligibility.staked > 0,
      eligible: eligibility.minted >= 100 && eligibility.staked > 0
    },
    {
      id: 3,
      title: "Community Builder Airdrop", 
      description: "Reward for sustained mining and high token holdings",
      requirement: "Hold 1000+ tokens and mine for 24h+",
      reward: "1000 KRYPT tokens",
      progress: Math.min(100, (eligibility.balance / 1000) * (eligibility.mining ? 100 : 50)),
      completed: eligibility.balance >= 1000 && eligibility.mining,
      eligible: eligibility.balance >= 1000 && eligibility.mining
    },
    {
      id: 4,
      title: "Genesis Block Airdrop",
      description: "Final reward when blockchain development completes",
      requirement: "Be active when all 4500 components are complete",
      reward: "2000 KRYPT tokens",
      progress: Math.min(100, (blockchainProgress.completedComponents / 4500) * 100),
      completed: blockchainProgress.completedComponents >= 4500,
      eligible: user?.balance && user.balance > 0
    }
  ]

  // Generate raffle tickets based on user activity
  useEffect(() => {
    const tickets = Math.floor(eligibility.totalScore / 100) + (user?.raffleTickets || 0)
    setRaffleTickets(tickets)
  }, [eligibility.totalScore, user?.raffleTickets])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="terminal-window">
        <h1 className="text-2xl font-bold text-terminal-green mb-4">
          KRYPT Rewards System
        </h1>
        <p className="text-terminal-green/80 mb-6">
          Earn rewards through airdrops and raffles based on your participation in the Krypt ecosystem.
        </p>
        
        <div className="bg-terminal-green/10 border border-terminal-green/30 p-4 rounded mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-terminal-green/60">Your Score:</span>
              <div className="text-terminal-green font-bold text-lg">{eligibility.totalScore.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-terminal-green/60">Raffle Tickets:</span>
              <div className="text-terminal-green font-bold text-lg">{raffleTickets}</div>
            </div>
            <div>
              <span className="text-terminal-green/60">Airdrops Eligible:</span>
              <div className="text-terminal-green font-bold text-lg">
                {airdropMilestones.filter(m => m.eligible).length}/{airdropMilestones.length}
              </div>
            </div>
            <div>
              <span className="text-terminal-green/60">Development:</span>
              <div className="text-terminal-green font-bold text-lg">
                Phase {blockchainProgress.currentPhase}/4
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="terminal-window">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-terminal-green">Rewards Center</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('airdrops')}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === 'airdrops'
                  ? 'text-terminal-green border-b border-terminal-green'
                  : 'text-terminal-green/60 hover:text-terminal-green'
              }`}
            >
              🎁 Airdrops
            </button>
            <button
              onClick={() => setActiveTab('raffles')}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === 'raffles'
                  ? 'text-terminal-green border-b border-terminal-green'
                  : 'text-terminal-green/60 hover:text-terminal-green'
              }`}
            >
              🎲 Raffles
            </button>
          </div>
        </div>

        {activeTab === 'airdrops' && (
          <div className="space-y-4">
            <div className="text-terminal-green/80 mb-6">
              Automatic airdrops based on development milestones and user activity. Rewards are distributed when conditions are met.
            </div>
            
            {airdropMilestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className={`border rounded p-4 transition-colors ${
                  milestone.completed 
                    ? 'border-terminal-green bg-terminal-green/5' 
                    : milestone.eligible
                    ? 'border-terminal-green/60 bg-terminal-green/5'
                    : 'border-terminal-green/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-terminal-green font-bold mb-1">{milestone.title}</h3>
                    <p className="text-terminal-green/70 text-sm mb-2">{milestone.description}</p>
                    <div className="text-terminal-green/60 text-xs">
                      Requirement: {milestone.requirement}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-terminal-green font-bold">{milestone.reward}</div>
                    <div className={`text-xs ${
                      milestone.completed ? 'text-terminal-green' :
                      milestone.eligible ? 'text-yellow-400' : 'text-terminal-green/60'
                    }`}>
                      {milestone.completed ? '✅ Completed' :
                       milestone.eligible ? '🟡 Eligible' : '⏳ Not Eligible'}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-terminal-gray border border-terminal-green/30 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      milestone.completed ? 'bg-terminal-green' : 'bg-terminal-green/60'
                    }`}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
                <div className="text-terminal-green/60 text-xs mt-1 text-right">
                  {milestone.progress.toFixed(0)}% progress
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'raffles' && (
          <div className="space-y-6">
            <div className="text-terminal-green/80 mb-6">
              Enter raffles using tickets earned through ecosystem participation. More activity = more tickets!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-terminal-green/30 p-4 rounded">
                <h3 className="text-terminal-green font-bold mb-3">🎫 Your Raffle Tickets</h3>
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-terminal-green mb-2">{raffleTickets}</div>
                  <div className="text-terminal-green/60 text-sm">Available Tickets</div>
                </div>
                <div className="text-xs text-terminal-green/60">
                  Earn more tickets by:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Mining tokens (+1 ticket per 100 tokens)</li>
                    <li>Staking tokens (+1 ticket per 100 staked)</li>
                    <li>Holding tokens (+1 ticket per 100 held)</li>
                    <li>Minting tokens (+2 tickets per 100 minted)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-terminal-green/30 p-4 rounded">
                  <h4 className="text-terminal-green font-bold mb-2">🏆 Hourly KRYPT Raffle</h4>
                  <div className="text-terminal-green/70 text-sm mb-3">
                    Prize Pool: 1,000 KRYPT tokens
                  </div>
                  <div className="text-terminal-green/60 text-xs mb-3">
                    Next Draw: Every hour on the hour
                  </div>
                  <button 
                    className="terminal-button w-full py-2 text-sm"
                    disabled={raffleTickets === 0}
                  >
                    {raffleTickets > 0 ? `Enter Raffle (1 ticket)` : 'Need Tickets'}
                  </button>
                </div>

                <div className="border border-terminal-green/30 p-4 rounded">
                  <h4 className="text-terminal-green font-bold mb-2">💎 Mega Jackpot</h4>
                  <div className="text-terminal-green/70 text-sm mb-3">
                    Prize Pool: 50,000 KRYPT tokens
                  </div>
                  <div className="text-terminal-green/60 text-xs mb-3">
                    Next Draw: When blockchain development completes
                  </div>
                  <button 
                    className="terminal-button w-full py-2 text-sm"
                    disabled={raffleTickets < 10}
                  >
                    {raffleTickets >= 10 ? `Enter Mega Raffle (10 tickets)` : 'Need 10 Tickets'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-terminal-green/5 border border-terminal-green/30 p-4 rounded">
              <h4 className="text-terminal-green font-bold mb-2">🎯 How Raffles Work</h4>
              <div className="text-terminal-green/70 text-sm space-y-2">
                <p>• Tickets are earned automatically based on your ecosystem activity</p>
                <p>• Each ticket gives you one entry into the selected raffle</p>
                <p>• Winners are selected randomly using cryptographically secure methods</p>
                <p>• Prize tokens are distributed automatically to winner's wallet</p>
                <p>• You can enter multiple raffles if you have enough tickets</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}