import type { Icon } from '@phosphor-icons/react'
import {
  CaretRight,
  ChartBar,
  CreditCard,
  Storefront,
  Tag,
  UserCircle,
  Users,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'

interface ManageMenuItem {
  label: string
  description: string
  icon: Icon
  iconBg: string
  iconColor: string
  path: string
}

const menuItems: ManageMenuItem[] = [
  {
    label: 'Outlet',
    description: 'Kelola outlet dan cabang',
    icon: Storefront,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/outlets',
  },
  {
    label: 'Harga Layanan',
    description: 'Atur harga layanan laundry',
    icon: Tag,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/pricing',
  },
  {
    label: 'Kasir',
    description: 'Kelola akun kasir',
    icon: UserCircle,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/cashiers',
  },
  {
    label: 'Metode Pembayaran',
    description: 'Atur metode pembayaran',
    icon: CreditCard,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/payment-methods',
  },
  {
    label: 'Member',
    description: 'Kelola data pelanggan member',
    icon: Users,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/members',
  },
  {
    label: 'Analitik',
    description: 'Lihat laporan dan statistik',
    icon: ChartBar,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/analytics',
  },
]

function MenuCard({ item, onClick }: { item: ManageMenuItem; onClick: () => void }) {
  const IconComponent = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border rounded-[var(--radius)] p-4 active:bg-muted transition-colors touch-manipulation"
    >
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center ${item.iconBg}`}
        >
          <IconComponent size={22} weight="fill" className={item.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        <CaretRight size={18} weight="bold" className="shrink-0 text-muted-foreground" />
      </div>
    </button>
  )
}

export function ManagePage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Kelola</h1>
        <p className="text-sm text-muted-foreground">Manajemen outlet, layanan, dan tim</p>
      </div>

      <div className="px-4 pb-6 space-y-2">
        {menuItems.map((item) => (
          <MenuCard
            key={item.path}
            item={item}
            onClick={() => router.navigate({ to: item.path })}
          />
        ))}
      </div>
    </div>
  )
}
