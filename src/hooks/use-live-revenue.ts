import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'

export interface LiveRevenue {
  revenue: number
  transactions: number
  timestamp: string
}

/**
 * Connects to the SSE endpoint for live revenue data.
 * Uses fetch + ReadableStream so we can pass the Authorization header
 * (EventSource does not support custom headers).
 */
export function useLiveRevenue() {
  const [data, setData] = useState<LiveRevenue | null>(null)
  const [connected, setConnected] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const token = useAuthStore.getState().token
    if (!token) return

    const controller = new AbortController()
    abortRef.current = controller

    async function connect() {
      try {
        const res = await fetch(`${API_BASE_URL}/owner/dashboard/live`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          setConnected(false)
          return
        }

        setConnected(true)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE messages are separated by double newlines
          const parts = buffer.split('\n\n')
          // Keep the last (possibly incomplete) chunk in the buffer
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            const lines = part.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6)) as LiveRevenue
                  setData(parsed)
                } catch {
                  // ignore malformed data
                }
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setConnected(false)
        }
      }
    }

    connect()

    return () => {
      controller.abort()
      abortRef.current = null
      setConnected(false)
    }
  }, [])

  return { data, connected }
}
