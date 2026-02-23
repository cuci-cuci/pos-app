import {
  Bed,
  Drop,
  Flame,
  type Icon,
  Lightning,
  Scales,
  Sneaker,
  Sparkle,
  SquaresFour,
  Tag,
  TShirt,
  Wind,
} from '@phosphor-icons/react'

/**
 * Maps backend icon string (from service_categories.icon column) to Phosphor Icon component.
 * Falls back to name-based matching, then to Tag icon.
 */

const ICON_STRING_MAP: Record<string, Icon> = {
  shirt: TShirt,
  iron: Flame,
  droplets: Drop,
  sparkles: Sparkle,
  footprints: Sneaker,
  'layout-grid': SquaresFour,
  'bed-double': Bed,
  drop: Drop,
  flame: Flame,
  wind: Wind,
  scales: Scales,
  lightning: Lightning,
  sneaker: Sneaker,
  tshirt: TShirt,
  tag: Tag,
}

const ICON_COLOR_MAP: Record<string, string> = {
  shirt: 'text-blue-500',
  iron: 'text-orange-500',
  droplets: 'text-cyan-500',
  sparkles: 'text-purple-500',
  footprints: 'text-amber-600',
  'layout-grid': 'text-teal-500',
  'bed-double': 'text-indigo-500',
}

// Fallback: match category name keywords
const NAME_ICONS: Record<string, Icon> = {
  setrika: Flame,
  'dry clean': Wind,
  kiloan: Scales,
  express: Lightning,
  sepatu: Sneaker,
  pakaian: TShirt,
  karpet: SquaresFour,
  gorden: SquaresFour,
  bed: Bed,
  selimut: Bed,
  cuci: Drop,
}

const NAME_COLORS: Record<string, string> = {
  setrika: 'text-orange-500',
  'dry clean': 'text-purple-500',
  kiloan: 'text-amber-600',
  express: 'text-yellow-500',
  sepatu: 'text-amber-600',
  pakaian: 'text-success',
  karpet: 'text-teal-500',
  gorden: 'text-teal-500',
  bed: 'text-indigo-500',
  selimut: 'text-indigo-500',
  cuci: 'text-blue-500',
}

export function getCategoryIcon(name: string, icon?: string): Icon {
  if (icon && ICON_STRING_MAP[icon]) {
    return ICON_STRING_MAP[icon]
  }
  const lower = name.toLowerCase()
  const key = Object.keys(NAME_ICONS).find((k) => lower.includes(k))
  return key ? NAME_ICONS[key] : Tag
}

export function getCategoryColor(name: string, icon?: string): string {
  if (icon && ICON_COLOR_MAP[icon]) {
    return ICON_COLOR_MAP[icon]
  }
  const lower = name.toLowerCase()
  const key = Object.keys(NAME_COLORS).find((k) => lower.includes(k))
  return key ? NAME_COLORS[key] : 'text-primary'
}
