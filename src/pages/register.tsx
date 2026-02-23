import { zodResolver } from '@hookform/resolvers/zod'
import { CircleNotch, Drop, WarningCircle } from '@phosphor-icons/react'
import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { APP_NAME } from '@/lib/constants'
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

export function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [registerState, setRegisterState] = useState<RegisterState>('idle')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm">
        {/* Logo and app name */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-3">
            <Drop size={36} weight="fill" className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-1">Daftarkan Bisnis Anda</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Buat Akun Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-[var(--radius)] p-3">
                  <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium">
                  Nama Bisnis
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

              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">
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

              <div className="space-y-2">
                <label htmlFor="ownerName" className="text-sm font-medium">
                  Nama Pemilik
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
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Konfirmasi Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  No. Telepon <span className="text-muted-foreground">(opsional)</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  disabled={isLoading}
                  {...register('phone')}
                />
              </div>

              <Button type="submit" size="lg" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <CircleNotch size={20} weight="bold" className="animate-spin" />
                    {stateMessages[registerState]}
                  </span>
                ) : (
                  'Daftar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
