import { create } from 'zustand'
import type { Shift } from '@/services/shift-api'
import { shiftApi } from '@/services/shift-api'

interface ShiftState {
  currentShift: Shift | null
  loading: boolean
  fetchCurrentShift: () => Promise<void>
  openShift: (data: { outlet_id: string; opening_cash: number }) => Promise<Shift>
  closeShift: (data: { closing_cash: number; notes?: string }) => Promise<Shift>
  clearShift: () => void
}

export const useShiftStore = create<ShiftState>()((set, get) => ({
  currentShift: null,
  loading: false,

  fetchCurrentShift: async () => {
    set({ loading: true })
    const maxRetries = 2
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await shiftApi.getCurrent()
        set({ currentShift: res.data })
        return
      } catch {
        if (attempt < maxRetries) {
          // Wait before retry (500ms, then 1s)
          await new Promise((r) => setTimeout(r, (attempt + 1) * 500))
          continue
        }
        set({ currentShift: null })
      }
    }
    set({ loading: false })
  },

  openShift: async (data) => {
    try {
      const res = await shiftApi.open(data)
      set({ currentShift: res.data })
      return res.data
    } catch (err) {
      // If 409 conflict, shift is already open — fetch and use it
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('409') || msg.includes('Conflict') || msg.includes('conflict')) {
        await get().fetchCurrentShift()
        const current = get().currentShift
        if (current) return current
      }
      throw err
    }
  },

  closeShift: async (data) => {
    const res = await shiftApi.close(data)
    set({ currentShift: null })
    return res.data
  },

  clearShift: () => {
    set({ currentShift: null })
  },
}))
