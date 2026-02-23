import { Drop, Flame, Wind, Scales, Lightning, Sneaker, TShirt, Tag, type Icon } from '@phosphor-icons/react'

const CATEGORY_ICONS: Record<string, Icon> = {
  'Cuci': Drop,
  'Setrika': Flame,
  'Dry Clean': Wind,
  'Kiloan': Scales,
  'Express': Lightning,
  'Sepatu': Sneaker,
  'Pakaian': TShirt,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Cuci': 'text-blue-500',
  'Setrika': 'text-orange-500',
  'Dry Clean': 'text-teal-500',
  'Kiloan': 'text-amber-600',
  'Express': 'text-yellow-500',
  'Sepatu': 'text-purple-500',
  'Pakaian': 'text-success',
}

export function getCategoryIcon(name: string): Icon {
  const key = Object.keys(CATEGORY_ICONS).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  )
  return key ? CATEGORY_ICONS[key] : Tag
}

export function getCategoryColor(name: string): string {
  const key = Object.keys(CATEGORY_COLORS).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  )
  return key ? CATEGORY_COLORS[key] : 'text-primary'
}
