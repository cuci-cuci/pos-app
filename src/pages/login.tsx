import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '@/services/auth-service'
import { syncEngine } from '@/sync/sync-engine'
import { useDeviceStore } from '@/stores/device-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import { Drop, SpinnerGap, WarningCircle } from '@phosphor-icons/react'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

type LoginState = 'idle' | 'authenticating' | 'syncing' | 'redirecting'

const stateMessages: Record<LoginState, string> = {
  idle: 'Masuk',
  authenticating: 'Memverifikasi...',
  syncing: 'Menyinkronkan data...',
  redirecting: 'Mengalihkan...',
}

export function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loginState, setLoginState] = useState<LoginState>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setLoginState('authenticating')

    try {
      await login(data.email, data.password)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login gagal. Periksa email dan password Anda.'

      // Provide more specific error messages
      let displayMessage = message
      if (message.includes('401') || message.includes('Unauthorized')) {
        displayMessage = 'Email atau password salah.'
      } else if (message.includes('NetworkError') || message.includes('fetch')) {
        displayMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      } else if (message.includes('500')) {
        displayMessage = 'Terjadi kesalahan pada server. Coba lagi nanti.'
      }

      setError(displayMessage)
      setLoginState('idle')
      return
    }

    // Initial sync
    setLoginState('syncing')
    try {
      await syncEngine.init()
    } catch {
      // Sync failure is non-fatal, continue to redirect
    }

    // Redirect based on device state
    setLoginState('redirecting')
    const isReady = useDeviceStore.getState().isDeviceReady()
    if (isReady) {
      await router.navigate({ to: '/' })
    } else {
      await router.navigate({ to: '/setup' })
    }
  }

  const isLoading = loginState !== 'idle'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--muted)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo and app name */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary)] mb-3">
            <Drop size={36} className="text-[var(--primary-foreground)]" weight="duotone" />
          </div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Sistem POS Laundry
          </p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Masuk ke Akun Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm rounded-[var(--radius)] p-3">
                  <WarningCircle size={18} className="shrink-0 mt-0.5" weight="bold" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap size={20} className="animate-spin" />
                    {stateMessages[loginState]}
                  </span>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
          {APP_NAME} v1.0.0
        </p>
      </div>
    </div>
  )
}
