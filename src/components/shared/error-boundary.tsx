import { WarningOctagon } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
}

export function RouteErrorFallback({ error }: { error: Error }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="mb-3 flex items-center justify-center rounded-full w-12 h-12 bg-destructive/10">
        <WarningOctagon size={24} weight="fill" className="text-destructive" />
      </div>
      <h2 className="text-base font-bold mb-1">Terjadi Kesalahan</h2>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs">{error.message}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.history.back()}>
          Kembali
        </Button>
        <Button size="sm" onClick={() => window.location.reload()}>
          Muat Ulang
        </Button>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="mb-4 flex items-center justify-center rounded-full w-16 h-16 bg-destructive/10">
            <WarningOctagon size={32} weight="fill" className="text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Terjadi Kesalahan</h1>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Aplikasi mengalami masalah. Silakan coba muat ulang halaman.
          </p>
          {this.state.error?.message && (
            <div className="mb-6 max-w-md w-full rounded-[var(--radius)] bg-destructive/5 border border-destructive/20 p-3">
              <p className="text-xs text-destructive font-mono break-all">
                {this.state.error.message}
              </p>
            </div>
          )}
          <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
        </div>
      )
    }
    return this.props.children
  }
}
