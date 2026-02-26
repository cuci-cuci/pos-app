import { zodResolver } from '@hookform/resolvers/zod'
import { CircleNotch, Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'
import { Link, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
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
      <motion.div
        className="w-full max-w-[400px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header bar — tucked behind card with negative margin */}
        <motion.div
          className="bg-foreground/5 rounded-t-xl px-5 pt-4 pb-6 -mb-3 relative z-0"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <span className="text-sm font-medium text-muted-foreground">Masuk atau daftar</span>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="bg-card border rounded-xl overflow-hidden relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="px-6 py-8">
            {/* Welcome heading */}
            <motion.h1
              className="text-2xl font-bold tracking-tight mb-8"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              Selamat Datang di{' '}
              <span className="text-primary">{APP_NAME}</span>
            </motion.h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3"
                  >
                    <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

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
        </motion.div>

        {/* Footer bar — tucked behind card with negative margin */}
        <motion.div
          className="bg-foreground/5 rounded-b-xl px-5 pt-6 pb-4 -mt-3 relative z-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="text-sm text-muted-foreground">
            Butuh bantuan? Hubungi kami di{' '}
            <a
              href="mailto:help@kelarin.co.id"
              className="text-primary font-medium hover:text-primary/80"
            >
              help@kelarin.co.id
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
