import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import ApiService from '@/services/api'

export default function Tokens() {
  const { user, updateUserWallet, updateUserMintedAmount, toggleMining, addStake, setUser } = useStore()
  const [activeTab, setActiveTab] = useState<'wallet' | 'mint' | 'mine' | 'stake'>('wallet')
  const [mintAmount, setMintAmount] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeDuration, setStakeDuration] = useState<1 | 7 | 30>(1)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferAddress, setTransferAddress] = useState('')
  const [transferStatus, setTransferStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [stakeStatus, setStakeStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [notification, setNotification] = useState<{ type: 'warning' | 'error' | 'success'; message: string } | null>(null)
  
  // Live leaderboard data
  const [leaderboard, setLeaderboard] = useState<Array<{ address: string; balance: number }>>([])  
  
  // Notification helper
  const showNotification = (type: 'warning' | 'error' | 'success', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000) // Auto-dismiss after 5 seconds
  }
  
  // Sync staked amount from backend on page load
  useEffect(() => {
    const syncUserData = async () => {
      if (!user?.walletAddress) return
      
      try {
        const apiService = ApiService.getInstance()
        const backendUserData = await apiService.getUserData(user.walletAddress)
        
        if (backendUserData && backendUserData.stakedAmount > 0) {
          const currentFrontendStaked = user.stakes?.reduce((total, stake) => total + stake.amount, 0) || 0
          
          // If backend has staked amount but frontend doesn't, sync it
          if (backendUserData.stakedAmount !== currentFrontendStaked) {
            console.log(`🔄 Syncing staked amount: Backend=${backendUserData.stakedAmount}, Frontend=${currentFrontendStaked}`)
            
            // For now, create a single synthetic stake entry to represent the total staked amount
            // This is a simple solution until we store individual stakes in the backend
            const syntheticStake = {
              id: 'synced-' + Date.now(),
              amount: backendUserData.stakedAmount,
              startDate: new Date(),
              duration: 7, // Default to 7 days
              dailyReturn: backendUserData.stakedAmount * 0.008 // 0.8% daily for 7 days
            }
            
            // Clear existing stakes and add the synthetic one
            updateUserWallet(user.walletAddress, backendUserData.balance || user.balance || 0)
            // Reset stakes array and add synthetic stake
            const updatedUser = {
              ...user,
              stakes: [syntheticStake],
              balance: backendUserData.balance || user.balance || 0,
              mintedAmount: backendUserData.mintedAmount || user.mintedAmount || 0
            }
            setUser(updatedUser)
            
            console.log('✅ Staked amount synced from backend!')
          }
        }
      } catch (error) {
        console.error('Failed to sync user data from backend:', error)
      }
    }
    
    syncUserData()
  }, [user?.walletAddress]) // Only run when wallet address changes

  // Stable leaderboard management with user persistence
  useEffect(() => {
    const apiService = ApiService.getInstance()
    let isActive = true
    
    const updateLeaderboard = async () => {
      try {
        const data = await apiService.getLeaderboard()
        if (isActive && data && Array.isArray(data)) {
          
          setLeaderboard((prevLeaderboard: Array<{ address: string; balance: number }>) => {
            // Create fast lookup for new data
            const newDataMap = new Map<string, number>()
            data
              .filter((holder: any) => 
                holder && 
                holder.address && 
                typeof holder.balance === 'number' && 
                holder.balance >= 0
              )
              .forEach((holder: any) => {
                newDataMap.set(holder.address, holder.balance)
              })
            
            // If no valid new data, keep existing leaderboard
            if (newDataMap.size === 0) {
              return prevLeaderboard
            }
            
            // Fast bulk update: maintain existing users, update their balances
            const updatedUsers: { address: string; balance: number }[] = []
            
            // Anti-glitch balance updates - only allow increases or maintain current
            prevLeaderboard.forEach((existingUser: { address: string; balance: number }) => {
              const newBalance = newDataMap.get(existingUser.address)
              if (newBalance !== undefined) {
                // We have fresh data for this user
                if (newBalance > 0) {
                  // Allow increases or significant legitimate decreases (like staking)
                  const balanceDiff = newBalance - existingUser.balance
                  
                  if (newBalance >= existingUser.balance) {
                    // Balance increased or stayed same - safe to update (includes mining rewards)
                    updatedUsers.push({
                      address: existingUser.address,
                      balance: newBalance
                    })
                  } else if (Math.abs(balanceDiff) > 50) {
                    // Large decrease (>50 tokens) - likely legitimate transaction (staking, transfers)
                    updatedUsers.push({
                      address: existingUser.address,
                      balance: newBalance
                    })
                  } else {
                    // Small decrease (<50 tokens) - likely API glitch, keep existing balance
                    // This blocks small negative glitches (-0.1 to -5) that cause backwards jumps
                    updatedUsers.push({
                      address: existingUser.address,
                      balance: existingUser.balance
                    })
                  }
                } 
                newDataMap.delete(existingUser.address) // Remove processed user
              } else {
                // No fresh data for this user - always keep current balance
                if (existingUser.balance > 0) {
                  updatedUsers.push({
                    address: existingUser.address,
                    balance: existingUser.balance
                  })
                }
              }
            })
            
            // Add any new users not in previous leaderboard
            newDataMap.forEach((balance: number, address: string) => {
              if (balance > 0) {
                updatedUsers.push({ address, balance })
              }
            })
            
            // Sort and get top 10
            const finalData = updatedUsers
              .sort((a: { address: string; balance: number }, b: { address: string; balance: number }) => b.balance - a.balance)
              .slice(0, 10)
            
            // Quick change detection
            if (finalData.length !== prevLeaderboard.length) {
              return finalData
            }
            
            const hasChanges = finalData.some((user: { address: string; balance: number }, index: number) => {
              const prevUser = prevLeaderboard[index]
              return !prevUser || user.address !== prevUser.address || user.balance !== prevUser.balance
            })
            
            return hasChanges ? finalData : prevLeaderboard
          })
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
        // Keep existing data on error - no flickering
      }
    }
    
    // Initial fetch
    updateLeaderboard()
    
    // Poll every 800ms for very responsive updates with bulletproof stability
    const interval = setInterval(updateLeaderboard, 800)
    
    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [])

  const handleMint = () => {
    const amount = parseInt(mintAmount) || 0
    const currentMinted = user?.mintedAmount || 0
    const newTotal = currentMinted + amount
    
    if (newTotal > 1000) {
      showNotification('warning', `🪙 You've reached your limit! Maximum mint is 1000 tokens per wallet. You can mint ${1000 - currentMinted} more tokens.`)
      return
    }
    
    if (user?.walletAddress) {
      updateUserWallet(user.walletAddress, (user.balance || 0) + amount)
      updateUserMintedAmount(amount)
      setMintAmount('')
      showNotification('success', `🎉 Successfully minted ${amount} KRYPT tokens! Added to your wallet.`)
    }
  }

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount) || 0
    
    if (amount > (user?.balance || 0)) {
      showNotification('warning', `💰 Insufficient balance! You have ${(user?.balance || 0).toFixed(2)} KRYPT tokens available.`)
      return
    }
    
    setStakeStatus('loading')
    
    if (user?.walletAddress) {
      try {
        // Calculate new amounts
        const newBalance = (user.balance || 0) - amount
        const currentStaked = user.stakes?.reduce((total, stake) => total + stake.amount, 0) || 0
        const newStakedAmount = currentStaked + amount
        
        // Update backend with new balance and staked amount
        const apiService = ApiService.getInstance()
        const result = await apiService.updateUserBalance(
          user.walletAddress, 
          newBalance,
          user.mintedAmount, // Preserve existing minted amount
          newStakedAmount     // Update staked amount
        )
        
        // Update frontend state with backend response
        updateUserWallet(user.walletAddress, result.balance || newBalance)
        const dailyReturn = getDailyReturn(stakeDuration, amount)
        addStake(amount, stakeDuration, dailyReturn)
        
        setStakeAmount('')
        setStakeStatus('success')
        
        console.log(`✅ Staking successful! Balance: ${newBalance}, Staked: ${newStakedAmount}`)
        
        // Reset success message after 4 seconds
        setTimeout(() => setStakeStatus('idle'), 4000)
        
      } catch (error) {
        console.error('Staking failed:', error)
        showNotification('error', 'Failed to stake tokens. Please try again.')
        setStakeStatus('idle')
      }
    }
  }

  const handleToggleMining = () => {
    toggleMining()
  }

  const getDailyReturn = (duration: number, amount?: number) => {
    const stakeAmt = amount ?? (parseFloat(stakeAmount) || 0)
    if (duration === 1) return stakeAmt * 0.005 * duration  // 0.5% daily
    if (duration === 7) return stakeAmt * 0.008 * duration  // 0.8% daily
    if (duration === 30) return stakeAmt * 0.012 * duration // 1.2% daily
    return stakeAmt * 0.005 * duration // Default to 0.5%
  }

  const getDailyPercentage = (duration: number) => {
    if (duration === 1) return 0.5  // 0.5% daily
    if (duration === 7) return 0.8  // 0.8% daily
    if (duration === 30) return 1.2 // 1.2% daily
    return 0.5 // Default to 0.5%
  }

  // Calculate correct daily rewards for existing stakes with new percentages
  const getCorrectDailyReward = (stake: any) => {
    const percentage = getDailyPercentage(stake.duration) / 100
    return stake.amount * percentage
  }

  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress || !user?.walletAddress) return

    setTransferStatus('loading')
    
    try {
      const amount = parseFloat(transferAmount)
      if (amount > (user.balance || 0)) {
        throw new Error('Insufficient balance')
      }
      
      // Call real transfer API
      const apiService = ApiService.getInstance()
      const result = await apiService.transferTokens(user.walletAddress, transferAddress, amount)
      
      if (result.success) {
        // Update sender's balance with backend response
        updateUserWallet(user.walletAddress, result.newBalance)
        
        setTransferStatus('success')
        setTransferAmount('')
        setTransferAddress('')
        
        showNotification('success', `🎉 Successfully transferred ${amount} KRYPT tokens to ${transferAddress.slice(0, 6)}...${transferAddress.slice(-4)}`)
        
        setTimeout(() => setTransferStatus('idle'), 3000)
      } else {
        throw new Error(result.message || 'Transfer failed')
      }
    } catch (error: any) {
      console.error('Transfer failed:', error)
      setTransferStatus('error')
      showNotification('error', error.message || 'Transfer failed. Please try again.')
      setTimeout(() => setTransferStatus('idle'), 3000)
    }
  }

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Custom Notification - Maximum z-index */}
      {notification && (
        <div 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md"
          style={{ 
            zIndex: 2147483647,
            pointerEvents: 'auto'
          }}
        >
          <div 
            className={`p-4 rounded-lg border-2 shadow-2xl ${
              notification.type === 'success' 
                ? 'bg-black border-terminal-green text-terminal-green' 
                : notification.type === 'warning'
                ? 'bg-black border-yellow-400 text-yellow-400'
                : 'bg-black border-red-400 text-red-400'
            }`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.98)',
              boxShadow: notification.type === 'success' 
                ? '0 0 50px rgba(0, 255, 0, 0.8), 0 0 100px rgba(0, 0, 0, 0.9)'
                : '0 0 50px rgba(255, 255, 0, 0.8), 0 0 100px rgba(0, 0, 0, 0.9)',
              position: 'relative',
              zIndex: 2147483647
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-terminal-green mb-4">
            KRYPT Wallet Operations
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Mint, mine, and stake KRYPT tokens for free. Build your position before mainnet launch.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-terminal-gray/20 rounded-lg p-1 flex space-x-1">
            {[
              { id: 'wallet', label: '💳 Wallet' },
              { id: 'mint', label: '🪙 Mint' },
              { id: 'mine', label: '⛏️ Mine' },
              { id: 'stake', label: '🔒 Stake' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'wallet' | 'mint' | 'mine' | 'stake')}
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

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wallet Details */}
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-terminal-green mb-4">Your KRYPT Wallet</h2>
              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded">
                  <h3 className="text-terminal-green font-semibold mb-2">Wallet Address</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-800 border border-terminal-green/30 p-3 rounded font-mono text-sm text-terminal-green break-all">
                      {user?.walletAddress || 'Generating...'}
                    </div>
                    <button
                      onClick={copyAddress}
                      className="bg-terminal-green text-black px-3 py-2 text-xs font-semibold rounded hover:bg-terminal-green/80 transition-colors"
                      disabled={!user?.walletAddress}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 p-4 rounded">
                    <h3 className="text-terminal-green font-semibold">Available Balance</h3>
                    <p className="text-2xl font-bold">{(user?.balance || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-400">KRYPT Tokens</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded">
                    <h3 className="text-terminal-green font-semibold">Staked Tokens</h3>
                    <p className="text-2xl font-bold">{(user?.stakes?.reduce((total, stake) => total + stake.amount, 0) || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Locked Staking</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded">
                    <h3 className="text-terminal-green font-semibold">Minted</h3>
                    <p className="text-2xl font-bold">{user?.mintedAmount || 0}</p>
                    <p className="text-sm text-gray-400">of 1000 Max</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded">
                    <h3 className="text-terminal-green font-semibold">Mining Status</h3>
                    <p className={`text-2xl font-bold ${user?.isMining ? 'text-terminal-green animate-pulse' : 'text-gray-400'}`}>
                      {user?.isMining ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-sm text-gray-400">Real-time Mining</p>
                  </div>
                </div>

                {/* Transfer Tokens */}
                <div className="bg-black/50 p-4 rounded">
                  <h3 className="text-terminal-green font-semibold mb-4">Transfer Tokens</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      placeholder="Recipient wallet address"
                      className="w-full bg-gray-800 border border-terminal-green/30 p-3 rounded text-white placeholder-gray-500"
                      disabled={transferStatus === 'loading'}
                    />
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Amount to transfer"
                      className="w-full bg-gray-800 border border-terminal-green/30 p-3 rounded text-white placeholder-gray-500"
                      disabled={transferStatus === 'loading'}
                      max={user?.balance || 0}
                    />
                    <button
                      onClick={handleTransfer}
                      disabled={!transferAmount || !transferAddress || transferStatus === 'loading'}
                      className="w-full bg-terminal-green text-black py-3 rounded font-semibold hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              </div>
            </div>

            {/* Top Holders Leaderboard */}
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-terminal-green mb-4">Top Holders</h2>
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((holder: { address: string; balance: number }, index: number) => (
                    <div key={holder.address} className="bg-black/50 p-4 rounded flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-terminal-green/20 rounded-full flex items-center justify-center">
                          <span className="text-terminal-green font-bold text-sm">#{index + 1}</span>
                        </div>
                        <span className="text-white font-mono text-sm">
                          {holder.address}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-terminal-green font-bold">{holder.balance.toLocaleString()}</div>
                        <div className="text-gray-400 text-xs">KRYPT</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-black/50 p-8 rounded text-center">
                    <p className="text-gray-400">Leaderboard will appear when users start holding tokens</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mint Tab */}
        {activeTab === 'mint' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-terminal-green mb-6">Mint KRYPT Tokens (FREE)</h2>
              <p className="text-gray-300 mb-8">
                Mint up to 1000 KRYPT tokens for free. No payment required - just enter amount and mint!
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-black/50 p-6 rounded">
                    <h3 className="text-terminal-green font-semibold mb-4">Mint Tokens</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Amount to Mint</label>
                        <input
                          type="number"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          placeholder="Enter amount (max 1000 total)"
                          className="w-full bg-gray-800 border border-terminal-green/30 p-3 rounded text-white placeholder-gray-500"
                          max={1000 - (user?.mintedAmount || 0)}
                        />
                        <div className="text-terminal-green/60 text-xs mt-1">
                          Remaining: {1000 - (user?.mintedAmount || 0)} tokens
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleMint}
                        disabled={!mintAmount || (user?.mintedAmount || 0) >= 1000}
                        className="w-full bg-terminal-green text-black py-3 rounded font-semibold hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mint Tokens (FREE)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 p-6 rounded">
                  <h3 className="text-terminal-green font-semibold mb-4">Mint Information</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• <span className="text-terminal-green">Free minting</span> for all users</li>
                    <li>• <span className="text-terminal-green">Maximum 1000 tokens</span> per wallet</li>
                    <li>• <span className="text-terminal-green">Instant delivery</span> to your wallet</li>
                    <li>• <span className="text-terminal-green">Tokens will be migrated</span> to mainnet</li>
                    <li>• <span className="text-terminal-green">No gas fees</span> or hidden costs</li>
                    <li>• <span className="text-terminal-green">Build your position</span> before launch</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mine Tab */}
        {activeTab === 'mine' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-terminal-green mb-6">Mine KRYPT Tokens</h2>
              <p className="text-gray-300 mb-8">
                Continuous mining while on this page. Toggle to start/stop earning rewards.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-black/50 p-6 rounded">
                    <h3 className="text-terminal-green font-semibold mb-4">Mining Control</h3>
                    <button
                      onClick={handleToggleMining}
                      className={`w-full py-6 px-6 border-2 font-bold text-lg rounded transition-all ${
                        user?.isMining
                          ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'border-terminal-green bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20'
                      }`}
                    >
                      {user?.isMining ? '🛑 Stop Mining' : '▶️ Start Mining'}
                    </button>
                    
                    {user?.isMining && (
                      <div className="mt-4 p-4 bg-terminal-green/5 border border-terminal-green/30 rounded">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-terminal-green rounded-full animate-pulse" />
                          <span className="text-terminal-green font-semibold">Mining Active Globally</span>
                        </div>
                        <div className="text-terminal-green/70 text-sm">
                          Earning 0.3-2 tokens every 5 seconds on all pages
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-black/50 p-6 rounded">
                    <h3 className="text-terminal-green font-semibold mb-4">Mining Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={user?.isMining ? 'text-terminal-green' : 'text-gray-400'}>
                          {user?.isMining ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rate:</span>
                        <span className="text-terminal-green">0.3-2 tokens/5s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Balance:</span>
                        <span className="text-terminal-green">{(user?.balance || 0).toFixed(2)} KRYPT</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 p-6 rounded">
                  <h3 className="text-terminal-green font-semibold mb-4">How Mining Works</h3>
                  <ul className="text-gray-300 space-y-3">
                    <li>• <span className="text-terminal-green">Click "Start Mining"</span> to begin earning</li>
                    <li>• <span className="text-terminal-green">Mining continues</span> while on this page</li>
                    <li>• <span className="text-terminal-green">Earn 0.3-2 tokens</span> every 5 seconds</li>
                    <li>• <span className="text-terminal-green">Stop anytime</span> by clicking "Stop Mining"</li>
                    <li>• <span className="text-terminal-green">Tokens added directly</span> to your balance</li>
                    <li>• <span className="text-terminal-green">No device resources</span> used for mining</li>
                    <li>• <span className="text-terminal-green">Completely free</span> to participate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stake Tab */}
        {activeTab === 'stake' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-terminal-gray/10 border border-terminal-green/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-terminal-green mb-6">Stake KRYPT Tokens</h2>
              <p className="text-gray-300 mb-8">
                Lock your tokens for fixed periods and earn daily returns. Choose your duration for different rewards.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-black/50 p-6 rounded">
                    <h3 className="text-terminal-green font-semibold mb-4">Staking Options (Daily Returns)</h3>
                    <div className="space-y-3">
                      <div className={`border-2 p-4 rounded cursor-pointer transition-colors ${
                        stakeDuration === 1 ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-green/30 hover:border-terminal-green/60'
                      }`} onClick={() => setStakeDuration(1)}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-terminal-green font-semibold">1 Day</span>
                          <span className="text-terminal-green">0.5% Daily</span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          Flexible staking - test the waters
                        </div>
                      </div>
                      
                      <div className={`border-2 p-4 rounded cursor-pointer transition-colors ${
                        stakeDuration === 7 ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-green/30 hover:border-terminal-green/60'
                      }`} onClick={() => setStakeDuration(7)}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-terminal-green font-semibold">7 Days</span>
                          <span className="text-terminal-green">0.8% Daily (5.6% Total)</span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          Popular choice - good balance
                        </div>
                      </div>
                      
                      <div className={`border-2 p-4 rounded cursor-pointer transition-colors ${
                        stakeDuration === 30 ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-green/30 hover:border-terminal-green/60'
                      }`} onClick={() => setStakeDuration(30)}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-terminal-green font-semibold">30 Days</span>
                          <span className="text-terminal-green">1.2% Daily (36% Total)</span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          Maximum returns - long term commitment
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/50 p-6 rounded">
                    <h3 className="text-terminal-green font-semibold mb-4">Stake New Tokens</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Amount to Stake</label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full bg-gray-800 border border-terminal-green/30 p-3 rounded text-white placeholder-gray-500"
                          max={user?.balance || 0}
                          disabled={stakeStatus === 'loading'}
                        />
                        <div className="text-terminal-green/60 text-xs mt-1">
                          Available: {(user?.balance || 0).toLocaleString()} KRYPT
                        </div>
                      </div>
                      
                      <div className="bg-terminal-green/5 border border-terminal-green/30 p-4 rounded">
                        <div className="text-terminal-green space-y-2">
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{stakeDuration} day{stakeDuration > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Return:</span>
                            <span>{getDailyPercentage(stakeDuration)}%</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-terminal-green/30 pt-2">
                            <span>Total Return:</span>
                            <span>{getDailyReturn(stakeDuration).toFixed(2)} KRYPT</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleStake}
                        disabled={!stakeAmount || parseFloat(stakeAmount) > (user?.balance || 0) || stakeStatus === 'loading'}
                        className="w-full bg-terminal-green text-black py-4 rounded font-semibold hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {stakeStatus === 'loading' ? 'Staking...' : `Stake for ${stakeDuration} Day${stakeDuration > 1 ? 's' : ''}`}
                      </button>

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
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Stakes */}
                <div>
                  {user?.stakes && user.stakes.length > 0 ? (
                    <div className="bg-black/50 p-6 rounded">
                      <h3 className="text-terminal-green font-semibold mb-4">🔒 Active Stakes</h3>
                      <div className="space-y-4">
                        {user.stakes.map((stake, index) => (
                          <div key={stake.id} className="border border-terminal-green/30 p-4 rounded bg-terminal-green/5">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-terminal-green font-semibold">Stake #{index + 1}</span>
                              <span className="text-gray-400 text-xs">
                                {new Date(stake.startDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Amount:</span>
                                <span className="text-terminal-green font-bold">{stake.amount.toLocaleString()} KRYPT</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Duration:</span>
                                <span className="text-terminal-green">{stake.duration} day{stake.duration > 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Daily Rate:</span>
                                <span className="text-terminal-green">{getDailyPercentage(stake.duration)}% daily</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Daily Rewards:</span>
                                <span className="text-terminal-green">{getCorrectDailyReward(stake).toFixed(2)} KRYPT</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-terminal-green/30 pt-4 mt-4">
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-gray-400">Total Staked:</span>
                            <span className="text-terminal-green">{user.stakes.reduce((total, stake) => total + stake.amount, 0).toLocaleString()} KRYPT</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-gray-400">Total Daily Rewards:</span>
                            <span className="text-terminal-green">{user.stakes.reduce((total, stake) => total + getCorrectDailyReward(stake), 0).toFixed(2)} KRYPT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/50 p-6 rounded">
                      <h3 className="text-terminal-green font-semibold mb-4">Staking Benefits</h3>
                      <ul className="text-gray-300 space-y-3">
                        <li>• <span className="text-terminal-green">Earn daily returns</span> on your tokens</li>
                        <li>• <span className="text-terminal-green">Higher rates</span> for longer commitments</li>
                        <li>• <span className="text-terminal-green">Secure your position</span> before mainnet</li>
                        <li>• <span className="text-terminal-green">Automatic reward</span> distribution</li>
                        <li>• <span className="text-terminal-green">Flexible durations</span> from 1-30 days</li>
                        <li>• <span className="text-terminal-green">No penalties</span> for early unstaking</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}