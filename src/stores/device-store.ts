import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DeviceState {
  deviceId: string
  deviceName: string
  outletId: string
  outletName: string
  isSetupComplete: boolean
  setupCompletedAt: string | null
  soundEnabled: boolean
  setDevice: (config: { deviceName?: string; outletId?: string; outletName?: string }) => void
  completeSetup: () => void
  resetDevice: () => void
  isDeviceReady: () => boolean
  setSoundEnabled: (enabled: boolean) => void
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      deviceId: crypto.randomUUID(),
      deviceName: '',
      outletId: '',
      outletName: '',
      isSetupComplete: false,
      setupCompletedAt: null,
      soundEnabled: true,
      setDevice: (config) => set({ ...config }),
      completeSetup: () =>
        set({ isSetupComplete: true, setupCompletedAt: new Date().toISOString() }),
      resetDevice: () =>
        set({
          deviceName: '',
          outletId: '',
          outletName: '',
          isSetupComplete: false,
          setupCompletedAt: null,
        }),
      isDeviceReady: () => get().isSetupComplete && get().outletId !== '',
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    { name: 'laundry-pos-device' },
  ),
)
