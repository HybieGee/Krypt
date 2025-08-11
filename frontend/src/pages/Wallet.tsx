import { useState } from 'react'
import { useStore } from '@/store/useStore'

export default function Wallet() {
  const { user, updateUserWallet } = useStore()
  const [transferAmount, setTransferAmount] = useState('')
  const [transferAddress, setTransferAddress] = useState('')
  const [transferStatus, setTransferStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Wallet is now auto-created globally in App.tsx on first visit

  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress || !user?.walletAddress) return

    setTransferStatus('loading')
    
    // Mock transfer logic
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="terminal-window">
        <h1 className="text-2xl font-bold text-terminal-green mb-4">
          KRYPT Wallet
        </h1>
        <p className="text-terminal-green/80 mb-6">
          Your secure wallet for KRYPT tokens. Auto-generated and stored securely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="terminal-window">
          <h2 className="text-lg font-bold text-terminal-green mb-4">Wallet Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-terminal-green/60 text-sm mb-2">Wallet Address</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-terminal-gray/50 border border-terminal-green/30 p-3 rounded font-mono text-sm text-terminal-green">
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

        <div className="terminal-window">
          <h2 className="text-lg font-bold text-terminal-green mb-4">Transfer Tokens</h2>
          
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
      </div>

      <div className="terminal-window">
        <h2 className="text-lg font-bold text-terminal-green mb-4">Recent Transactions</h2>
        
        <div className="text-terminal-green/60 text-center py-8">
          No transactions yet. Start by minting or mining tokens!
        </div>
      </div>
    </div>
  )
}