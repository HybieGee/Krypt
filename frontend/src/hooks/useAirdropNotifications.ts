import { useState, useEffect, useCallback } from 'react'
import ApiService from '@/services/api'
import { useStore } from '@/store/useStore'

interface AirdropData {
  airdropId: string
  milestoneId: string
  milestoneName: string
  reward: number
  timestamp: number
  claimed: boolean
  walletAddress: string
}

export function useAirdropNotifications() {
  const { user } = useStore()
  const [airdrops, setAirdrops] = useState<AirdropData[]>([])
  const [pendingAirdrops, setPendingAirdrops] = useState<AirdropData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check for new airdrops
  const checkAirdrops = useCallback(async () => {
    if (!user?.walletAddress) return

    try {
      setIsLoading(true)
      const apiService = ApiService.getInstance()
      const userAirdrops = await apiService.getUserAirdrops(user.walletAddress)
      
      // Filter unclaimed airdrops
      const unclaimed = userAirdrops.filter(airdrop => !airdrop.claimed)
      
      setAirdrops(userAirdrops)
      
      // Show notifications for new unclaimed airdrops
      const newAirdrops = unclaimed.filter(airdrop => 
        !pendingAirdrops.some(pending => pending.airdropId === airdrop.airdropId)
      )
      
      if (newAirdrops.length > 0) {
        setPendingAirdrops(prev => [...prev, ...newAirdrops])
      }
      
    } catch (error) {
      console.error('Failed to check airdrops:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.walletAddress, pendingAirdrops])

  // Mark airdrop as seen
  const dismissAirdrop = useCallback(async (airdropId: string) => {
    if (!user?.walletAddress) return

    try {
      const apiService = ApiService.getInstance()
      await apiService.markAirdropSeen(user.walletAddress, airdropId)
      
      // Remove from pending notifications
      setPendingAirdrops(prev => 
        prev.filter(airdrop => airdrop.airdropId !== airdropId)
      )
      
      // Update airdrops list
      setAirdrops(prev => 
        prev.map(airdrop => 
          airdrop.airdropId === airdropId 
            ? { ...airdrop, claimed: true }
            : airdrop
        )
      )
      
    } catch (error) {
      console.error('Failed to mark airdrop as seen:', error)
    }
  }, [user?.walletAddress])

  // Auto-check on wallet change and periodically
  useEffect(() => {
    if (user?.walletAddress) {
      checkAirdrops()
      
      // Check every 30 seconds for new airdrops
      const interval = setInterval(checkAirdrops, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.walletAddress, checkAirdrops])

  return {
    airdrops,
    pendingAirdrops,
    isLoading,
    checkAirdrops,
    dismissAirdrop
  }
}