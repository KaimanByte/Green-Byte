import { getCarbonLevel } from '../data/regions'
import type { RegionDto } from '../types/api'
import type { RegionView } from '../types/views'
import { ViewFactory } from './ViewFactory'

const clampPercent = (value: number): number =>
  Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0)

/** Constrói `RegionView` a partir de `RegionDto`, concentrando fallbacks e rótulos. */
export class RegionViewFactory extends ViewFactory<RegionDto, RegionView> {
  createView(region: RegionDto): RegionView {
    const carbonIntensity = safeNumber(region.carbonIntensity)
    const regionName = region.region.trim()
    const country = region.country.trim()

    return {
      code: region.regionCode,
      displayName: region.city?.trim() || regionName || region.regionCode,
      locationLabel: [regionName, country].filter(Boolean).join(' · '),
      carbonIntensity,
      renewableSharePercent: clampPercent(region.renewableSharePercent),
      carbonLevel: getCarbonLevel(carbonIntensity),
    }
  }
}
