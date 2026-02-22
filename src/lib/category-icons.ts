import { Droplet, Flame, Wind, Scale, Zap, Footprints, Shirt, Tag, type LucideIcon } from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Cuci': Droplet,
  'Setrika': Flame,
  'Dry Clean': Wind,
  'Kiloan': Scale,
  'Express': Zap,
  'Sepatu': Footprints,
  'Pakaian': Shirt,
}

export function getCategoryIcon(name: string): LucideIcon {
  const key = Object.keys(CATEGORY_ICONS).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  )
  return key ? CATEGORY_ICONS[key] : Tag
}
