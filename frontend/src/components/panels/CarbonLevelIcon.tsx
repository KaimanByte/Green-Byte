import { Cloud, CloudFog, Leaf } from 'lucide-react'
import type { CarbonLevel } from '../../data/regions'

// nome do ícone (vem dos dados) → desenho
const ICONS = {
  leaf: Leaf,
  cloud: Cloud,
  smog: CloudFog,
}

type Props = {
  icon: CarbonLevel['icon']
}

export function CarbonLevelIcon({ icon }: Props) {
  const Icon = ICONS[icon]
  return <Icon size={14} strokeWidth={2} aria-hidden="true" />
}