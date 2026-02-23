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

export const useShiftStore = create<ShiftState>()((set) => ({
  currentShift: null,
  loading: false,

  fetchCurrentShift: async () => {
    set({ loading: true })
    try {
      const res = await shiftApi.getCurrent()
      set({ currentShift: res.data })
    } catch {
      set({ currentShift: null })
    } finally {
      set({ loading: false })
    }
  },

  openShift: async (data) => {
    const res = await shiftApi.open(data)
    set({ currentShift: res.data })
    return res.data
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
