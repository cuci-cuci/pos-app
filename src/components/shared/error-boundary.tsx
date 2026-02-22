import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

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
          <AlertCircle size={48} className="text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Terjadi Kesalahan</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Aplikasi mengalami masalah. Silakan coba muat ulang halaman.
          </p>
          <Button onClick={() => window.location.reload()}>
            Muat Ulang
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
