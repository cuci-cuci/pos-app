import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, CircleNotch, Eye, EyeSlash, Storefront, User, WarningCircle } from '@phosphor-icons/react'
import { Link, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/api-client'
import { type AuthUser, useAuthStore } from '@/stores/auth-store'
import { syncEngine } from '@/sync/sync-engine'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 50)
}

const registerSchema = z
  .object({
    businessName: z.string().min(1, 'Nama bisnis wajib diisi'),
    slug: z
      .string()
      .min(1, 'Slug wajib diisi')
      .regex(/^[a-z0-9]+$/, 'Slug hanya boleh huruf kecil dan angka'),
    ownerName: z.string().min(1, 'Nama pemilik wajib diisi'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

interface APIRegisterResponse {
  data: {
    access_token: string
    refresh_token: string
    user: {
      id: string
      name: string
      email: string
      role: string
      tenant_id?: string
    }
  }
}

type RegisterState = 'idle' | 'registering' | 'syncing' | 'redirecting'

const stateMessages: Record<RegisterState, string> = {
  idle: 'Daftar',
  registering: 'Mendaftarkan...',
  syncing: 'Menyinkronkan data...',
  redirecting: 'Mengalihkan...',
}

const STEPS = [
  { id: 'business', label: 'Bisnis', icon: Storefront },
  { id: 'account', label: 'Akun', icon: User },
] as const

export function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [registerState, setRegisterState] = useState<RegisterState>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      slug: '',
      ownerName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  })

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue('businessName', value)
    setValue('slug', slugify(value), { shouldValidate: watch('slug') !== '' })
  }

  const handleNextStep = async () => {
    const valid = await trigger(['businessName', 'slug', 'phone'])
    if (valid) setCurrentStep(1)
  }

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    setRegisterState('registering')

    let responseData: APIRegisterResponse['data']

    try {
      const response = await apiClient
        .post('auth/register', {
          json: {
            business_name: data.businessName,
            slug: data.slug,
            owner_name: data.ownerName,
            email: data.email,
            password: data.password,
            phone: data.phone || undefined,
          },
        })
        .json<APIRegisterResponse>()

      responseData = response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.'

      let displayMessage = message
      if (message.includes('409') || message.includes('Conflict')) {
        displayMessage = 'Email atau slug sudah digunakan.'
      } else if (message.includes('422')) {
        displayMessage = 'Data tidak valid. Periksa kembali formulir Anda.'
      } else if (message.includes('NetworkError') || message.includes('fetch')) {
        displayMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      } else if (message.includes('500')) {
        displayMessage = 'Terjadi kesalahan pada server. Coba lagi nanti.'
      }

      setError(displayMessage)
      setRegisterState('idle')
      return
    }

    const { access_token, refresh_token, user } = responseData
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id ?? '',
    }
    useAuthStore.getState().login(access_token, refresh_token, authUser)

    // Initial sync
    setRegisterState('syncing')
    try {
      await syncEngine.init()
    } catch {
      // Sync failure is non-fatal, continue to redirect
    }

    // Redirect to setup
    setRegisterState('redirecting')
    await router.navigate({ to: '/setup' })
  }

  const isLoading = registerState !== 'idle'

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/60 p-4">
      <motion.div
        className="w-full max-w-[440px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header bar */}
        <motion.div
          className="bg-foreground/5 rounded-t-xl px-5 pt-4 pb-6 -mb-3 relative z-0"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <span className="text-sm font-medium text-muted-foreground">Buat akun baru</span>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="bg-card border rounded-xl overflow-hidden relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="px-6 py-8">
            {/* Heading */}
            <motion.h1
              className="text-2xl font-bold tracking-tight mb-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              Daftar ke <span className="text-primary">{APP_NAME}</span>
            </motion.h1>
            <p className="text-sm text-muted-foreground mb-6">
              Siapkan bisnis Anda dalam 2 langkah mudah
            </p>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isActive = i === currentStep
                const isDone = i < currentStep
                return (
                  <div key={s.id} className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDone) setCurrentStep(i)
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : isDone
                            ? 'bg-primary text-primary-foreground cursor-pointer'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon size={16} weight={isActive || isDone ? 'fill' : 'regular'} />
                      <span>{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={cn('h-px w-4 shrink-0', isDone ? 'bg-primary' : 'bg-border')} />
                    )}
                  </div>
                )
              })}
            </div>

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

              {/* Step 1: Business Info */}
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step-business"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="businessName" className="text-sm font-medium text-muted-foreground">
                        Nama bisnis
                      </label>
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Contoh: Laundry Bersih Kilat"
                        disabled={isLoading}
                        {...register('businessName')}
                        onChange={handleBusinessNameChange}
                      />
                      {errors.businessName && (
                        <p className="text-xs text-destructive">{errors.businessName.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="slug" className="text-sm font-medium text-muted-foreground">
                        Slug
                      </label>
                      <Input
                        id="slug"
                        type="text"
                        placeholder="laundrybersihkilat"
                        disabled={isLoading}
                        {...register('slug')}
                      />
                      <p className="text-xs text-muted-foreground">
                        Huruf kecil dan angka saja, tanpa spasi atau simbol
                      </p>
                      {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">
                        No. telepon <span className="text-muted-foreground/60">(opsional)</span>
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        disabled={isLoading}
                        {...register('phone')}
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        size="lg"
                        className="h-11 px-8"
                        onClick={handleNextStep}
                      >
                        Lanjutkan
                        <ArrowRight size={16} weight="bold" className="ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Account Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-account"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="ownerName" className="text-sm font-medium text-muted-foreground">
                        Nama pemilik
                      </label>
                      <Input
                        id="ownerName"
                        type="text"
                        placeholder="Nama lengkap pemilik"
                        disabled={isLoading}
                        {...register('ownerName')}
                      />
                      {errors.ownerName && (
                        <p className="text-xs text-destructive">{errors.ownerName.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                        Alamat email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@contoh.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...register('email')}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimal 6 karakter"
                          autoComplete="new-password"
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

                    <div className="space-y-1.5">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                        Konfirmasi password
                      </label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Ulangi password"
                          autoComplete="new-password"
                          disabled={isLoading}
                          className="pr-10"
                          {...register('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeSlash size={18} weight="bold" />
                          ) : (
                            <Eye size={18} weight="bold" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-11 px-6"
                        onClick={() => setCurrentStep(0)}
                      >
                        <ArrowLeft size={16} weight="bold" className="mr-1" />
                        Kembali
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        className="h-11 px-8"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <CircleNotch size={18} weight="bold" className="animate-spin" />
                            {stateMessages[registerState]}
                          </span>
                        ) : (
                          'Daftar'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </motion.div>

        {/* Footer bar */}
        <motion.div
          className="bg-primary rounded-b-xl px-5 pt-6 pb-4 -mt-3 relative z-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="text-sm text-primary-foreground/80">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary-foreground font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
