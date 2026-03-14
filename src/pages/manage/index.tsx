import type { Icon } from '@phosphor-icons/react'
import {
  CaretRight,
  ChartBar,
  CreditCard,
  CrownSimple,
  CurrencyCircleDollar,
  GearSix,
  LinkSimple,
  MapPin,
  Package,
  Storefront,
  Tag,
  Truck,
  UserCircle,
  Users,
  UsersThree,
  WhatsappLogo,
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
    label: 'Inventaris',
    description: 'Kelola stok bahan dan perlengkapan',
    icon: Package,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    path: '/manage/inventory',
  },
  {
    label: 'Pemetaan Bahan Layanan',
    description: 'Atur bahan yang dipakai tiap layanan & auto-deduct',
    icon: LinkSimple,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    path: '/manage/service-supplies',
  },
  {
    label: 'Zona Pengiriman',
    description: 'Atur zona dan tarif ongkos kirim',
    icon: MapPin,
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-500',
    path: '/manage/delivery-zones',
  },
  {
    label: 'Jemput & Antar',
    description: 'Kelola permintaan pickup dan delivery',
    icon: Truck,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    path: '/manage/delivery-requests',
  },
  {
    label: 'Keuangan',
    description: 'Pengeluaran, laba rugi, arus kas',
    icon: CurrencyCircleDollar,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    path: '/manage/finance',
  },
  {
    label: 'Performa Staf',
    description: 'Pantau kinerja kasir dan karyawan',
    icon: UsersThree,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    path: '/manage/staff',
  },
  {
    label: 'Analitik',
    description: 'Lihat laporan dan statistik',
    icon: ChartBar,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/analytics',
  },
  {
    label: 'Notifikasi WhatsApp',
    description: 'Kirim update otomatis ke pelanggan',
    icon: WhatsappLogo,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
    path: '/manage/notifications',
  },
  {
    label: 'Langganan',
    description: 'Paket, penggunaan, dan upgrade',
    icon: CrownSimple,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    path: '/manage/subscription',
  },
  {
    label: 'Pengaturan Toko',
    description: 'Edit nama, alamat, pajak, dan struk',
    icon: GearSix,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    path: '/manage/store-settings',
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
