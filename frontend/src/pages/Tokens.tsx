import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'

export default function Tokens() {
  const { user, updateUserWallet, updateUserMintedAmount, toggleMining, setStaking } = useStore()
  const [activeTab, setActiveTab] = useState<'wallet' | 'mint' | 'mine' | 'stake'>('wallet')
  const [mintAmount, setMintAmount] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeDuration, setStakeDuration] = useState<1 | 7 | 30>(1)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferAddress, setTransferAddress] = useState('')
  const [transferStatus, setTransferStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [stakeStatus, setStakeStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  
  // Mock leaderboard data
  const [leaderboard] = useState([
    { address: '0x1a2b...3c4d', balance: 50000 },
    { address: '0x5e6f...7g8h', balance: 45000 },
    { address: '0x9i0j...1k2l', balance: 42000 },
    { address: '0x3m4n...5o6p', balance: 38000 },
    { address: '0x7q8r...9s0t', balance: 35000 },
    { address: '0x1u2v...3w4x', balance: 32000 },
    { address: '0x5y6z...7a8b', balance: 28000 },
    { address: '0x9c0d...1e2f', balance: 25000 },
    { address: '0x3g4h...5i6j', balance: 22000 },
    { address: '0x7k8l...9m0n', balance: 20000 },
  ])
  
  // Auto-generate wallet if needed
  useEffect(() => {
    if (!user?.walletAddress) {
      const generatedAddress = `0x${Math.random().toString(16).substring(2, 42)}`
      updateUserWallet(generatedAddress, 0)
    }
  }, [user, updateUserWallet])
  
  // Mining is now handled globally in App.tsx

  const handleMint = () => {
    const amount = parseInt(mintAmount) || 0
    const currentMinted = user?.mintedAmount || 0
    const newTotal = currentMinted + amount
    
    if (newTotal > 1000) {
      alert('Maximum mint limit is 1000 tokens per user')
      return
    }
    
    if (user?.walletAddress) {
      updateUserWallet(user.walletAddress, (user.balance || 0) + amount)
      updateUserMintedAmount(amount)
      setMintAmount('')
    }
  }

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount) || 0
    
    if (amount > (user?.balance || 0)) {
      alert('Insufficient balance')
      return
    }
    
    setStakeStatus('loading')
    
    // Simulate staking process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (user?.walletAddress) {
      // Remove staked amount from balance
      updateUserWallet(user.walletAddress, (user.balance || 0) - amount)
      // Add to staking
      setStaking(amount, stakeDuration)
      setStakeAmount('')
      setStakeStatus('success')
      
      // Reset success message after 4 seconds
      setTimeout(() => setStakeStatus('idle'), 4000)
    }
  }

  const handleToggleMining = () => {
    toggleMining()
  }

  const getDailyReturn = (duration: number) => {
    return (parseFloat(stakeAmount) || 0) * 0.01 * duration
  }

  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress || !user?.walletAddress) return

    setTransferStatus('loading')
    
    try {
      const amount = parseFloat(transferAmount)
      if (amount > (user.balance || 0)) {
        throw new Error('Insufficient balance')
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update balance (this would normally be handled by the backend)
      updateUserWallet(user.walletAddress, (user.balance || 0) - amount)
      
      setTransferStatus('success')
      setTransferAmount('')
      setTransferAddress('')
      
      setTimeout(() => setTransferStatus('idle'), 3000)
    } catch (error) {
      setTransferStatus('error')
      setTimeout(() => setTransferStatus('idle'), 3000)
    }
  }

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="terminal-window">
        <h1 className="text-2xl font-bold text-terminal-green mb-4">
          KRYPT Token Operations
        </h1>
        <p className="text-terminal-green/80 mb-6">
          Mint, mine, and stake KRYPT tokens for free. Build your position before mainnet launch.
        </p>
        
        <div className="bg-terminal-green/10 border border-terminal-green/30 p-4 rounded mb-6">
          <div className="text-terminal-green/90 text-sm">
            ✅ Free operations: No wallet connection required - wallet auto-generated for each user.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Operations & Balance */}
        <div className="space-y-4">
          <div className="terminal-window">
            <h3 className="text-lg font-bold text-terminal-green mb-4">Operations</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('wallet')}
                className={`w-full text-left p-3 border transition-colors ${
                  activeTab === 'wallet'
                    ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                    : 'border-terminal-green/30 hover:border-terminal-green/60 text-terminal-green/60'
                }`}
              >
                💳 Wallet
              </button>
              <button
                onClick={() => setActiveTab('mint')}
                className={`w-full text-left p-3 border transition-colors ${
                  activeTab === 'mint'
                    ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                    : 'border-terminal-green/30 hover:border-terminal-green/60 text-terminal-green/60'
                }`}
              >
                🪙 Mint Tokens
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`w-full text-left p-3 border transition-colors ${
                  activeTab === 'mine'
                    ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                    : 'border-terminal-green/30 hover:border-terminal-green/60 text-terminal-green/60'
                }`}
              >
                ⛏️ Mine Tokens
              </button>
              <button
                onClick={() => setActiveTab('stake')}
                className={`w-full text-left p-3 border transition-colors ${
                  activeTab === 'stake'
                    ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                    : 'border-terminal-green/30 hover:border-terminal-green/60 text-terminal-green/60'
                }`}
              >
                🔒 Stake Tokens
              </button>
            </div>
          </div>

          <div className="terminal-window">
            <h4 className="text-sm font-bold text-terminal-green mb-3">Your Balance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-terminal-green/60">Available:</span>
                <span className="text-terminal-green">{(user?.balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green/60">Staked:</span>
                <span className="text-terminal-green">{(user?.stakedAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green/60">Minted:</span>
                <span className="text-terminal-green">{user?.mintedAmount || 0}/1000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green/60">Mining:</span>
                <span className={user?.isMining ? 'text-terminal-green animate-pulse' : 'text-terminal-green/60'}>
                  {user?.isMining ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="terminal-window">
            <h4 className="text-sm font-bold text-terminal-green mb-3">Top Holders</h4>
            <div className="space-y-1 text-xs">
              {leaderboard.map((holder, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-terminal-green/60 w-4">#{index + 1}</span>
                    <span className="text-terminal-green font-mono text-[10px]">
                      {holder.address}
                    </span>
                  </div>
                  <span className="text-terminal-green">
                    {holder.balance.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <div className="terminal-window h-full">
            {activeTab === 'wallet' && (
              <div>
                <h2 className="text-xl font-bold text-terminal-green mb-4">KRYPT Wallet</h2>
                <p className="text-terminal-green/70 mb-6 text-sm">
                  Your secure wallet for KRYPT tokens. Auto-generated and stored securely in your browser.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border border-terminal-green/30 p-4 rounded">
                      <h3 className="text-lg font-bold text-terminal-green mb-4">Wallet Details</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-terminal-green/60 text-sm mb-2">Wallet Address</label>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-terminal-gray/50 border border-terminal-green/30 p-3 rounded font-mono text-sm text-terminal-green break-all">
                              {user?.walletAddress || 'Generating...'}
                            </div>
                            <button
                              onClick={copyAddress}
                              className="terminal-button px-3 py-2 text-xs"
                              disabled={!user?.walletAddress}
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-terminal-green/60 text-sm mb-2">Balance</label>
                          <div className="bg-terminal-gray/50 border border-terminal-green/30 p-3 rounded">
                            <span className="text-2xl font-bold text-terminal-green">
                              {(user?.balance || 0).toLocaleString()}
                            </span>
                            <span className="text-terminal-green/60 ml-2">KRYPT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-terminal-green/30 p-4 rounded">
                      <h3 className="text-lg font-bold text-terminal-green mb-4">Transfer Tokens</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-terminal-green/60 text-sm mb-2">Recipient Address</label>
                          <input
                            type="text"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            placeholder="0x..."
                            className="terminal-input w-full"
                            disabled={transferStatus === 'loading'}
                          />
                        </div>

                        <div>
                          <label className="block text-terminal-green/60 text-sm mb-2">Amount</label>
                          <input
                            type="number"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            placeholder="0.00"
                            className="terminal-input w-full"
                            disabled={transferStatus === 'loading'}
                            max={user?.balance || 0}
                          />
                        </div>

                        <button
                          onClick={handleTransfer}
                          disabled={!transferAmount || !transferAddress || transferStatus === 'loading'}
                          className="terminal-button w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {transferStatus === 'loading' ? 'Processing...' : 'Transfer Tokens'}
                        </button>

                        {transferStatus === 'success' && (
                          <div className="p-3 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green text-sm">
                            ✓ Transfer successful!
                          </div>
                        )}

                        {transferStatus === 'error' && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                            ✗ Transfer failed. Please check your balance and try again.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-terminal-green/30 p-4 rounded">
                      <h3 className="text-lg font-bold text-terminal-green mb-4">Recent Transactions</h3>
                      <div className="text-terminal-green/60 text-center py-4 text-sm">
                        No transactions yet. Start by minting or mining tokens!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mint' && (
              <div>
                <h2 className="text-xl font-bold text-terminal-green mb-4">Mint KRYPT Tokens (FREE)</h2>
                <p className="text-terminal-green/70 mb-6 text-sm">
                  Mint up to 1000 KRYPT tokens for free. No payment required - just enter amount and mint!
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-terminal-green/70 text-sm mb-2">Amount to Mint</label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="Enter amount (max 1000 total)"
                      className="terminal-input w-full"
                      max={1000 - (user?.mintedAmount || 0)}
                    />
                    <div className="text-terminal-green/60 text-xs mt-1">
                      Remaining: {1000 - (user?.mintedAmount || 0)} tokens
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleMint}
                    disabled={!mintAmount || (user?.mintedAmount || 0) >= 1000}
                    className="terminal-button w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mint Tokens (FREE)
                  </button>

                  <div className="bg-terminal-green/5 border border-terminal-green/30 p-4 rounded">
                    <h4 className="text-terminal-green font-bold mb-2">Mint Information</h4>
                    <ul className="text-terminal-green/70 text-sm space-y-1">
                      <li>• Free minting for all users</li>
                      <li>• Maximum 1000 tokens per wallet</li>
                      <li>• Instant delivery to your wallet</li>
                      <li>• Tokens will be migrated to mainnet</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mine' && (
              <div>
                <h2 className="text-xl font-bold text-terminal-green mb-4">Mine KRYPT Tokens</h2>
                <p className="text-terminal-green/70 mb-6 text-sm">
                  Continuous mining while on this page. Toggle to start/stop earning rewards.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border border-terminal-green/30 p-4 rounded">
                      <h4 className="text-terminal-green font-bold mb-3">Mining Control</h4>
                      <button
                        onClick={handleToggleMining}
                        className={`w-full py-4 px-6 border font-bold transition-all ${
                          user?.isMining
                            ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'border-terminal-green bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20'
                        }`}
                      >
                        {user?.isMining ? '🛑 Stop Mining' : '▶️ Start Mining'}
                      </button>
                      
                      {user?.isMining && (
                        <div className="mt-4 p-3 bg-terminal-green/5 border border-terminal-green/30 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                            <span className="text-terminal-green text-sm">Mining Active Globally</span>
                          </div>
                          <div className="text-terminal-green/60 text-xs mt-1">
                            Earning 1-6 tokens every 5 seconds on all pages
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border border-terminal-green/30 p-4 rounded">
                      <h4 className="text-terminal-green font-bold mb-3">Mining Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-terminal-green/60">Status:</span>
                          <span className={user?.isMining ? 'text-terminal-green' : 'text-terminal-green/60'}>
                            {user?.isMining ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-terminal-green/60">Rate:</span>
                          <span className="text-terminal-green">1-6 tokens/5s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-terminal-green/60">Your Balance:</span>
                          <span className="text-terminal-green">{(user?.balance || 0).toFixed(2)} KRYPT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-terminal-green/30 p-4 rounded">
                    <h4 className="text-terminal-green font-bold mb-3">How It Works</h4>
                    <ul className="text-terminal-green/70 text-sm space-y-2">
                      <li>• Click "Start Mining" to begin earning</li>
                      <li>• Mining continues while on this page</li>
                      <li>• Earn 1-6 tokens every 5 seconds</li>
                      <li>• Stop anytime by clicking "Stop Mining"</li>
                      <li>• Tokens added directly to your balance</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stake' && (
              <div>
                <h2 className="text-xl font-bold text-terminal-green mb-4">Stake KRYPT Tokens</h2>
                <p className="text-terminal-green/70 mb-6 text-sm">
                  Lock your tokens for fixed periods and earn daily returns. Choose your duration for different rewards.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="border border-terminal-green/30 p-4 rounded mb-4">
                      <h4 className="text-terminal-green font-bold mb-3">Staking Options (Daily Returns)</h4>
                      <div className="space-y-3">
                        <div className={`border p-3 rounded cursor-pointer transition-colors ${
                          stakeDuration === 1 ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-green/30 hover:border-terminal-green/60'
                        }`} onClick={() => setStakeDuration(1)}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-terminal-green">1 Day</span>
                            <span className="text-terminal-green">1% Daily</span>
                          </div>
                          <div className="text-terminal-green/60 text-xs">
                            Flexible staking - test the waters
                          </div>
                        </div>
                        
                        <div className={`border p-3 rounded cursor-pointer transition-colors ${
                          stakeDuration === 7 ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-green/30 hover:border-terminal-green/60'
                        }`} onClick={() => setStakeDuration(7)}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-terminal-green">7 Days</span>
                            <span className="text-terminal-green">1% Daily (7% Total)</span>
                          </div>
                          <div className="text-terminal-green/60 text-xs">
                            Popular choice - good balance
                          </div>
                        </div>
                        
                        <div className={`border p-3 rounded cursor-pointer transition-colors ${
                          stakeDuration === 30 ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-green/30 hover:border-terminal-green/60'
                        }`} onClick={() => setStakeDuration(30)}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-terminal-green">30 Days</span>
                            <span className="text-terminal-green">1% Daily (30% Total)</span>
                          </div>
                          <div className="text-terminal-green/60 text-xs">
                            Maximum returns - long term commitment
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Staking Display - moved below staking options */}
                    {user?.stakedAmount && user.stakedAmount > 0 && (
                      <div className="border border-terminal-green p-4 rounded bg-terminal-green/5">
                        <h4 className="text-terminal-green font-bold mb-3">🔒 Active Staking</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-terminal-green/70">Amount Staked:</span>
                            <span className="text-terminal-green font-bold">{user.stakedAmount.toLocaleString()} KRYPT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-terminal-green/70">Duration:</span>
                            <span className="text-terminal-green">{user.stakeDuration || 1} day{(user.stakeDuration || 1) > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-terminal-green/70">Daily Rewards:</span>
                            <span className="text-terminal-green">{(user.stakedAmount * 0.01).toFixed(2)} KRYPT</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">

                    <div className="border border-terminal-green/30 p-4 rounded">
                      <h4 className="text-terminal-green font-bold mb-3">Stake New Tokens</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-terminal-green/70 text-sm mb-2">Amount to Stake</label>
                          <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="terminal-input w-full"
                            max={user?.balance || 0}
                            disabled={stakeStatus === 'loading'}
                          />
                          <div className="text-terminal-green/60 text-xs mt-1">
                            Available: {(user?.balance || 0).toLocaleString()} KRYPT
                          </div>
                        </div>
                        
                        <div className="bg-terminal-green/5 border border-terminal-green/30 p-3 rounded">
                          <div className="text-terminal-green text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span>{stakeDuration} day{stakeDuration > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Daily Return:</span>
                              <span>{((parseFloat(stakeAmount) || 0) * 0.01).toFixed(2)} KRYPT</span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-terminal-green/30 pt-2 mt-2">
                              <span>Total Return:</span>
                              <span>{getDailyReturn(stakeDuration).toFixed(2)} KRYPT</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleStake}
                          disabled={!stakeAmount || parseFloat(stakeAmount) > (user?.balance || 0) || stakeStatus === 'loading'}
                          className="terminal-button w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {stakeStatus === 'loading' ? 'Staking...' : `Stake for ${stakeDuration} Day${stakeDuration > 1 ? 's' : ''}`}
                        </button>

                        {/* Themed Success Message */}
                        {stakeStatus === 'success' && (
                          <div className="border border-terminal-green bg-terminal-green/10 p-4 rounded relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-terminal-green/20 via-terminal-green/10 to-terminal-green/20 animate-pulse"></div>
                            <div className="relative z-10">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-3 h-3 bg-terminal-green rounded-full animate-ping"></div>
                                <span className="text-terminal-green font-bold text-lg">🔒 STAKING ACTIVATED</span>
                                <div className="w-3 h-3 bg-terminal-green rounded-full animate-ping"></div>
                              </div>
                              <div className="text-terminal-green/80 text-sm">
                                Your KRYPT tokens are now earning daily rewards!
                              </div>
                              <div className="text-terminal-green text-xs mt-2 font-mono">
                                &gt; SECURE_STAKING_PROTOCOL_ENABLED
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}