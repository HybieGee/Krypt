import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import ApiService from '@/services/api'

export default function Rewards() {
  const { user, statistics } = useStore()
  const [activeTab, setActiveTab] = useState<'milestones' | 'raffles'>('milestones')
  const [raffleTickets, setRaffleTickets] = useState(0)
  const [, setUserMilestones] = useState<any[]>([])
  const [raffleEntries, setRaffleEntries] = useState<any[]>([])
  const [raffleStatus, setRaffleStatus] = useState<any>({})

  // Early Access User Milestones with automatic distribution
  const earlyAccessMilestones = [
    {
      id: 1,
      title: "Early Pioneers",
      description: "First wave of early access users",
      userTarget: 25,
      reward: 250,
      status: statistics.earlyAccessUsers >= 25 ? 'completed' : 'active',
      progress: Math.min(100, (statistics.earlyAccessUsers / 25) * 100)
    },
    {
      id: 2,
      title: "Growing Community",
      description: "Community growth milestone",
      userTarget: 125,
      reward: 350,
      status: statistics.earlyAccessUsers >= 125 ? 'completed' : statistics.earlyAccessUsers >= 25 ? 'active' : 'locked',
      progress: Math.min(100, (statistics.earlyAccessUsers / 125) * 100)
    },
    {
      id: 3,
      title: "Established Base",
      description: "Strong user base established",
      userTarget: 500,
      reward: 500,
      status: statistics.earlyAccessUsers >= 500 ? 'completed' : statistics.earlyAccessUsers >= 125 ? 'active' : 'locked',
      progress: Math.min(100, (statistics.earlyAccessUsers / 500) * 100)
    },
    {
      id: 4,
      title: "Thriving Ecosystem",
      description: "Large active community",
      userTarget: 1500,
      reward: 1000,
      status: statistics.earlyAccessUsers >= 1500 ? 'completed' : statistics.earlyAccessUsers >= 500 ? 'active' : 'locked',
      progress: Math.min(100, (statistics.earlyAccessUsers / 1500) * 100)
    },
    {
      id: 5,
      title: "Massive Adoption",
      description: "Full community milestone",
      userTarget: 5000,
      reward: 2000,
      status: statistics.earlyAccessUsers >= 5000 ? 'completed' : statistics.earlyAccessUsers >= 1500 ? 'active' : 'locked',
      progress: Math.min(100, (statistics.earlyAccessUsers / 5000) * 100)
    }
  ]

  // Calculate user activity score for raffle tickets
  const calculateUserScore = () => {
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

  const userScore = calculateUserScore()

  // Check for milestone completion and auto-distribute rewards
  useEffect(() => {
    const checkMilestones = async () => {
      if (!user?.walletAddress) return
      
      const apiService = ApiService.getInstance()
      try {
        const milestoneData = await apiService.getUserMilestones(user.walletAddress)
        setUserMilestones(milestoneData || [])
      } catch (error) {
        console.error('Failed to fetch milestones:', error)
      }
    }
    
    checkMilestones()
  }, [user?.walletAddress, statistics.earlyAccessUsers])

  // Note: Raffle tickets now fetched from backend in loadRaffleData()

  // Load raffle entries and status
  const loadRaffleData = async () => {
    if (!user?.walletAddress) return
    
    const apiService = ApiService.getInstance()
    try {
      const [entries, status, tickets] = await Promise.all([
        apiService.getRaffleEntries(user.walletAddress),
        apiService.getRaffleStatus(),
        apiService.getUserTickets(user.walletAddress)
      ])
      console.log('Raffle entries:', entries)
      console.log('Raffle status:', status)
      console.log('User tickets details:', {
        availableTickets: tickets.availableTickets,
        totalTickets: tickets.totalTickets,
        usedTickets: tickets.usedTickets,
        fullResponse: tickets
      })
      setRaffleEntries(entries || [])
      setRaffleStatus(status || {})
      setRaffleTickets(tickets.availableTickets || 0)
    } catch (error) {
      console.error('Failed to fetch raffle data:', error)
    }
  }

  useEffect(() => {
    loadRaffleData()
  }, [user?.walletAddress])

  // Auto-refresh raffle data every 10 seconds when on raffles tab
  useEffect(() => {
    if (activeTab !== 'raffles' || !user?.walletAddress) return
    
    const interval = setInterval(loadRaffleData, 10000)
    return () => clearInterval(interval)
  }, [activeTab, user?.walletAddress])

  // Handle raffle entry
  const handleRaffleEntry = async (raffleType: string, ticketCost: number) => {
    if (!user?.walletAddress || raffleTickets < ticketCost) return
    
    const apiService = ApiService.getInstance()
    try {
      const result = await apiService.enterRaffle(user.walletAddress, raffleType, ticketCost)
      if (result.success) {
        setRaffleTickets(result.remainingTickets)
        // Immediately refresh all raffle data
        await loadRaffleData()
        
        // Show success feedback (could add a toast notification here)
        console.log(`Successfully entered ${raffleType} raffle!`)
      } else {
        console.error('Raffle entry failed:', result.message)
        alert(result.message || 'Failed to enter raffle')
      }
    } catch (error) {
      console.error('Failed to enter raffle:', error)
      alert('Failed to enter raffle. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-terminal-green mb-4">
            KRYPT Rewards System
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Automatic rewards distributed when Early Access user milestones are reached. Plus raffle participation for extra rewards!
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-terminal-gray/20 rounded-lg p-1 flex space-x-1">
            {[
              { id: 'milestones', label: '🎯 Milestones' },
              { id: 'raffles', label: '🎲 Raffles' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'milestones' | 'raffles')}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === tab.id 
                    ? 'bg-terminal-green text-black font-semibold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-terminal-gray/10 border border-terminal-green/20 p-4 rounded mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Your Score:</span>
              <div className="text-terminal-green font-bold text-lg">{userScore.totalScore.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Raffle Tickets:</span>
              <div className="text-terminal-green font-bold text-lg">{raffleTickets}</div>
            </div>
            <div>
              <span className="text-gray-400">Early Access Users:</span>
              <div className="text-terminal-green font-bold text-lg">
                {statistics.earlyAccessUsers.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Milestones:</span>
              <div className="text-terminal-green font-bold text-lg">
                {earlyAccessMilestones.filter(m => m.status === 'completed').length}/{earlyAccessMilestones.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-terminal-gray/10 border border-terminal-green/20 p-8 rounded-lg">

        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="text-gray-300 mb-6">
              Automatic rewards distributed to ALL wallet holders when Early Access user milestones are reached!
            </div>
            
            {earlyAccessMilestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className={`border rounded-lg p-5 transition-all duration-300 ${
                  milestone.status === 'completed' 
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
                    : milestone.status === 'active'
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                    : 'border-gray-600 bg-black/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`font-bold text-lg ${
                        milestone.status === 'completed' ? 'text-emerald-400' :
                        milestone.status === 'active' ? 'text-amber-400' : 'text-gray-400'
                      }`}>{milestone.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        milestone.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        milestone.status === 'active' ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {milestone.status === 'completed' ? '✅ REWARDED' :
                         milestone.status === 'active' ? '🎯 ACTIVE' : '🔒 LOCKED'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{milestone.description}</p>
                    <div className="text-gray-400 text-sm">
                      Target: {milestone.userTarget.toLocaleString()} Early Access Users
                    </div>
                    <div className="text-gray-400 text-sm">
                      Current: {statistics.earlyAccessUsers.toLocaleString()} users
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold mb-1 ${
                      milestone.status === 'completed' ? 'text-emerald-400' :
                      milestone.status === 'active' ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {milestone.reward.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm">KRYPT Tokens</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      milestone.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      milestone.status === 'active' ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gray-600'
                    }`}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
                <div className={`text-sm text-right ${
                  milestone.status === 'completed' ? 'text-emerald-400' :
                  milestone.status === 'active' ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {milestone.progress.toFixed(1)}% complete
                </div>
                
                {milestone.status === 'completed' && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-400/30 rounded text-emerald-300 text-sm">
                    🎉 Milestone reached! {milestone.reward} KRYPT tokens distributed to all wallet holders!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'raffles' && (
          <div className="space-y-6">
            <div className="text-gray-300 mb-6">
              Enter raffles using tickets earned through ecosystem participation. More activity = more tickets!
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ticket Balance */}
              <div className="bg-black/50 border border-terminal-green/30 p-6 rounded-lg">
                <h3 className="text-terminal-green font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎫</span>
                  Your Raffle Tickets
                </h3>
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-terminal-green mb-3">{raffleTickets}</div>
                  <div className="text-gray-400 text-sm">Available Tickets</div>
                </div>
                <div className="text-xs text-gray-400 space-y-2">
                  <div className="font-semibold text-terminal-green mb-2">Earn tickets by:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>• Mining: +1/100 tokens</div>
                    <div>• Staking: +1/100 staked</div>
                    <div>• Holding: +1/100 held</div>
                    <div>• Minting: +2/100 minted</div>
                  </div>
                </div>
              </div>

              {/* Active Raffles */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-black/50 border border-terminal-green/30 p-5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-terminal-green font-bold text-lg flex items-center">
                      <span className="text-2xl mr-2">🏆</span>
                      Hourly KRYPT Raffle
                    </h4>
                    <span className="bg-terminal-green/20 text-terminal-green px-3 py-1 rounded-full text-xs">
                      ACTIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Prize Pool:</span>
                      <div className="text-terminal-green font-bold">1,000 KRYPT</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Cost:</span>
                      <div className="text-terminal-green font-bold">1 Ticket</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Next Draw:</span>
                      <div className="text-terminal-green font-bold">Every hour</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Entries:</span>
                      <div className="text-terminal-green font-bold">
                        {raffleEntries.filter(entry => entry.raffleType === 'hourly').length} / {raffleStatus.hourly?.totalEntries || 0}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRaffleEntry('hourly', 1)}
                    className="w-full py-3 px-4 bg-terminal-green hover:bg-terminal-green/80 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={raffleTickets < 1}
                  >
                    {raffleTickets >= 1 ? 'Enter Hourly Raffle (1 ticket)' : 'Need 1 Ticket'}
                  </button>
                </div>

                <div className="bg-black/50 border border-terminal-green/30 p-5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-terminal-green font-bold text-lg flex items-center">
                      <span className="text-2xl mr-2">💎</span>
                      Weekly Mega Jackpot
                    </h4>
                    <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs">
                      WEEKLY
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Prize Pool:</span>
                      <div className="text-terminal-green font-bold">25,000 KRYPT</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Cost:</span>
                      <div className="text-terminal-green font-bold">5 Tickets</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Next Draw:</span>
                      <div className="text-terminal-green font-bold">Every Sunday</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Entries:</span>
                      <div className="text-terminal-green font-bold">
                        {raffleEntries.filter(entry => entry.raffleType === 'weekly').length} / {raffleStatus.weekly?.totalEntries || 0}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRaffleEntry('weekly', 5)}
                    className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={raffleTickets < 5}
                  >
                    {raffleTickets >= 5 ? 'Enter Weekly Jackpot (5 tickets)' : 'Need 5 Tickets'}
                  </button>
                </div>

                <div className="bg-black/50 border border-terminal-green/30 p-5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-emerald-400 font-bold text-lg flex items-center">
                      <span className="text-2xl mr-2">🚀</span>
                      Genesis Launch Lottery
                    </h4>
                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs">
                      SPECIAL
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-emerald-300/60">Prize Pool:</span>
                      <div className="text-emerald-300 font-bold">100,000 KRYPT</div>
                    </div>
                    <div>
                      <span className="text-emerald-300/60">Cost:</span>
                      <div className="text-emerald-300 font-bold">10 Tickets</div>
                    </div>
                    <div>
                      <span className="text-emerald-300/60">Draw Date:</span>
                      <div className="text-emerald-300 font-bold">Mainnet Launch</div>
                    </div>
                    <div>
                      <span className="text-emerald-300/60">Entries:</span>
                      <div className="text-emerald-300 font-bold">
                        {raffleEntries.filter(entry => entry.raffleType === 'genesis').length} / {raffleStatus.genesis?.totalEntries || 0}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRaffleEntry('genesis', 10)}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={raffleTickets < 10}
                  >
                    {raffleTickets >= 10 ? 'Enter Genesis Lottery (10 tickets)' : 'Need 10 Tickets'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-terminal-gray/10 border border-terminal-green/20 p-6 rounded-lg">
              <h4 className="text-terminal-green font-bold mb-3 flex items-center">
                <span className="text-xl mr-2">🎯</span>
                How Raffles Work
              </h4>
              <div className="text-gray-300 text-sm space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>• <strong>Tickets earned automatically</strong> based on your ecosystem activity</p>
                  <p>• <strong>Multiple entries allowed</strong> - more tickets = better odds</p>
                  <p>• <strong>Provably fair draws</strong> using cryptographically secure randomness</p>
                </div>
                <div>
                  <p>• <strong>Automatic prize distribution</strong> to winner's wallet</p>
                  <p>• <strong>Real-time entry tracking</strong> - see your chances</p>
                  <p>• <strong>No expiration</strong> - tickets stay in your account until used</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}