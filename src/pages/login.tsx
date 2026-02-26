import { zodResolver } from '@hookform/resolvers/zod'
import { CircleNotch, Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [agreedTnc, setAgreedTnc] = useState(true)

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
        {/* Header bar — flush top */}
        <div className="bg-foreground/5 rounded-t-xl px-5 py-3">
          <span className="text-sm font-medium text-muted-foreground">Masuk atau daftar</span>
        </div>

        {/* Main card */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="px-6 py-8">
            {/* Welcome heading */}
            <h1 className="text-2xl font-bold tracking-tight mb-8">
              Selamat Datang di{' '}
              <span className="text-primary">{APP_NAME}</span>
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3">
                  <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
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
                  <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Reset password
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} weight="bold" />
                    ) : (
                      <Eye size={18} weight="bold" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Terms checkbox */}
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTnc}
                    onChange={(e) => setAgreedTnc(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary accent-primary"
                  />
                  <span className="text-sm text-muted-foreground leading-tight">
                    Dengan masuk, saya menyetujui{' '}
                    <span className="text-primary font-medium">Syarat & Ketentuan</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 px-8"
                  disabled={isLoading || !agreedTnc}
                >
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
        </div>

        {/* Footer bar — flush bottom */}
        <div className="bg-foreground/5 rounded-b-xl px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Butuh bantuan? Hubungi kami di{' '}
            <a
              href="mailto:help@kelarin.co.id"
              className="text-primary font-medium hover:text-primary/80"
            >
              help@kelarin.co.id
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
