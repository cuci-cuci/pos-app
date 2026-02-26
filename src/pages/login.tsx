import { zodResolver } from '@hookform/resolvers/zod'
import { CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_NAME } from '@/lib/constants'
import { login } from '@/services/auth-service'
import { useDeviceStore } from '@/stores/device-store'
import { syncEngine } from '@/sync/sync-engine'

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
    <div className="min-h-screen flex items-center justify-center bg-muted/60 p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-card border rounded-[var(--radius)] overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <span className="text-sm font-medium text-foreground">Masuk atau daftar</span>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Welcome heading */}
            <h1 className="text-2xl font-bold tracking-tight mb-8">
              Selamat Datang di{' '}
              <span className="text-primary">{APP_NAME}</span>
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-[var(--radius)] p-3">
                  <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Alamat email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan alamat email"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Reset password
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" size="lg" className="h-11 px-8" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <CircleNotch size={18} weight="bold" className="animate-spin" />
                      {stateMessages[loginState]}
                    </span>
                  ) : (
                    'Masuk'
                  )}
                </Button>
                <Link to="/register">
                  <Button type="button" variant="outline" size="lg" className="h-11 px-6">
                    Buat akun
                  </Button>
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Belum yakin? Coba gunakan email bisnis Anda untuk masuk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
