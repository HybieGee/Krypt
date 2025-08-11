import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'

export function useEarlyAccessTracking() {
  const { updateStatistics } = useStore()
  const visitRegisteredRef = useRef(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Debounced visit registration - only run once per session
    if (!visitRegisteredRef.current) {
      visitRegisteredRef.current = true
      
      // Try the full Redis-based endpoint first, fallback to simple if it fails
      const tryVisitEndpoint = async (endpoint: string) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        return response.json()
      }
      
      // Use Cloudflare Worker endpoint
      tryVisitEndpoint('/api/early-access/visit')
        .then(data => {
          const newCount = data.count || 0
          setCount(newCount)
          updateStatistics({ earlyAccessUsers: newCount })
          console.log('Early access visit registered. Count:', newCount)
        })
        .catch(error => {
          console.error('Failed to register visit:', error)
        })
    }

    // Set up real-time updates via Server-Sent Events
    try {
      const eventSource = new EventSource('/api/early-access/stream')
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const newCount = data.count || 0
          
          if (newCount !== count) {
            setCount(newCount)
            updateStatistics({ earlyAccessUsers: newCount })
            console.log('Real-time count update:', newCount)
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.warn('SSE connection error, falling back to polling:', error)
        eventSource.close()
        
        // Fallback to polling if SSE fails
        if (!fallbackIntervalRef.current) {
          fallbackIntervalRef.current = setInterval(() => {
            // Use Cloudflare Worker count endpoint
            fetch('/api/early-access/count')
              .then(response => {
                if (!response.ok) throw new Error('Count endpoint failed')
                return response.json()
              })
              .catch(error => {
                console.error('Count endpoint failed:', error)
                return { count: 0 }
              })
              .then(data => {
                const newCount = data.count || 0
                if (newCount !== count) {
                  setCount(newCount)
                  updateStatistics({ earlyAccessUsers: newCount })
                }
              })
              .catch(error => {
                console.error('Polling error:', error)
              })
          }, 10000) // Poll every 10 seconds as fallback
        }
      }

    } catch (error) {
      console.error('Failed to establish SSE connection:', error)
      
      // Immediate fallback to polling
      fallbackIntervalRef.current = setInterval(() => {
        fetch('/api/early-access/count')
          .then(response => {
            if (!response.ok) throw new Error('Count endpoint failed')
            return response.json()
          })
          .catch(error => {
            console.error('Count endpoint failed:', error)
            return { count: 0 }
          })
          .then(data => {
            const newCount = data.count || 0
            if (newCount !== count) {
              setCount(newCount)
              updateStatistics({ earlyAccessUsers: newCount })
            }
          })
          .catch(error => {
            console.error('Polling error:', error)
          })
      }, 10000) // Poll every 10 seconds
    }

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
        fallbackIntervalRef.current = null
      }
    }
  }, [count, updateStatistics])

  return count
}