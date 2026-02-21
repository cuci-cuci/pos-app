import type { Service } from '@/db/schema'
import { ServiceCard } from './service-card'
import { EmptyState } from '@/components/shared/empty-state'
import { MagnifyingGlass } from '@phosphor-icons/react'

interface ServiceGridProps {
  services: Service[]
  onSelectService: (service: Service) => void
}

export function ServiceGrid({ services, onSelectService }: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={<MagnifyingGlass size={48} />}
        title="Tidak ada layanan"
        description="Belum ada layanan untuk kategori ini. Lakukan sinkronisasi untuk mengunduh data."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} onSelect={onSelectService} />
      ))}
    </div>
  )
}
