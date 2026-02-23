import { ArrowLeft, CircleNotch, Drop } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import ky from 'ky'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { API_BASE_URL, APP_NAME } from '@/lib/constants'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)

    try {
      await ky.post(`${API_BASE_URL}/auth/forgot-password`, {
        json: { email },
      }).json()
      setSent(true)
    } catch {
      setError('Terjadi kesalahan. Coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-3">
            <Drop size={36} weight="fill" className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Lupa Password</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Jika email terdaftar, Anda akan menerima link untuk reset password.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft size={16} weight="bold" className="mr-2" />
                    Kembali ke Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Masukkan email Anda untuk menerima link reset password.
                </p>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <CircleNotch size={20} className="animate-spin" />
                  ) : (
                    'Kirim Link Reset'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/login" className="font-medium underline">
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  )
}
