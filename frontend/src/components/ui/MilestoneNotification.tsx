import { useState, useEffect } from 'react'
import { X, Trophy, Gift } from 'lucide-react'

interface AirdropData {
  airdropId: string
  milestoneId: string
  milestoneName: string
  reward: number
  timestamp: number
  claimed: boolean
  walletAddress: string
}

interface MilestoneNotificationProps {
  airdrop: AirdropData
  onDismiss: (airdropId: string) => void
  delay?: number
}

export default function MilestoneNotification({ airdrop, onDismiss, delay = 0 }: MilestoneNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Start with fade-in animation after delay
    setTimeout(() => setIsAnimating(true), 100 + delay)
  }, [delay])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss(airdrop.airdropId)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className={`transition-all duration-300 transform pointer-events-auto ${
      isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div 
        className="bg-black/98 border-2 border-terminal-green shadow-2xl rounded-lg p-4 max-w-sm relative overflow-hidden backdrop-blur-sm" 
        style={{ 
          boxShadow: '0 0 50px rgba(0, 255, 0, 0.5), 0 0 100px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0, 255, 0, 0.1)',
          zIndex: 2147483647,
          position: 'relative'
        }}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-terminal-green/5 to-terminal-green/10 animate-pulse"></div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-terminal-green/60 hover:text-terminal-green transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="bg-terminal-green/20 rounded-full p-2">
            <Trophy className="text-terminal-green" size={20} />
          </div>
          <div>
            <h3 className="text-terminal-green font-bold text-sm">🎯 Milestone Achieved!</h3>
            <p className="text-terminal-green/80 text-xs">{airdrop.milestoneName}</p>
          </div>
        </div>

        {/* Reward */}
        <div className="bg-terminal-green/10 border border-terminal-green/30 rounded p-3 mb-3">
          <div className="flex items-center justify-center space-x-2">
            <Gift className="text-terminal-green" size={24} />
            <div className="text-center">
              <div className="text-terminal-green font-bold text-lg">+{airdrop.reward.toLocaleString()}</div>
              <div className="text-terminal-green/80 text-xs">KRYPT Tokens</div>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-terminal-green/90 text-xs text-center mb-3">
          🎉 Congratulations! You were among the first 25 early supporters and have received an airdrop reward!
        </p>

        {/* Timestamp */}
        <div className="text-terminal-green/60 text-xs text-center">
          {new Date(airdrop.timestamp).toLocaleString()}
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-lg border border-terminal-green/50 animate-pulse pointer-events-none"></div>
      </div>
    </div>
  )
}