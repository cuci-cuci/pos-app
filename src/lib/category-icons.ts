import { Drop, Fire, Wind, Scales, Lightning, SneakerMove, TShirt, Tag, type Icon } from '@phosphor-icons/react'

const CATEGORY_ICONS: Record<string, Icon> = {
  'Cuci': Drop,
  'Setrika': Fire,
  'Dry Clean': Wind,
  'Kiloan': Scales,
  'Express': Lightning,
  'Sepatu': SneakerMove,
  'Pakaian': TShirt,
}

export function getCategoryIcon(name: string): Icon {
  const key = Object.keys(CATEGORY_ICONS).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  )
  return key ? CATEGORY_ICONS[key] : Tag
}
