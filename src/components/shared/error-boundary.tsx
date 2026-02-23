import { WarningOctagon } from '@phosphor-icons/react'
import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
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
