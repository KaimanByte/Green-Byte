import { useState } from 'react'
import { REGIONS, type Region } from '../data/regions'
import type { RegionDto, ServiceDto } from '../types/api'
import { useGreenData } from './useGreenData'

function buildRegions(regions: RegionDto[], services: ServiceDto[]): Region[] {
  return regions.map((region) => ({
    code: region.regionCode,
    city: region.city ?? region.region,
    area: region.region,
    country: region.country,
    latitude: region.latitude,
    longitude: region.longitude,
    carbonIntensity: region.carbonIntensity,
    renewableShare: region.renewableSharePercent,
    services: services
      .filter((service) => service.regionCode === region.regionCode)
      .map((service) => service.name),
    labelSide: REGIONS.find((local) => local.code === region.regionCode)?.labelSide,
  }))
}

/**
 * Regiões do globo e da busca montadas com os dados reais do backend
 * (GET /regions + GET /services), no mesmo formato `Region` que o globo já usa.
 * Da lista local (data/regions.ts) só se aproveita `labelSide`, que é ajuste visual
 * de posição do rótulo, não dado. Enquanto o backend não responde, o globo fica sem marcadores.
 *
 * A referência do array só muda quando o conteúdo muda: a atualização automática (60 s)
 * devolve objetos novos, e o globo refaz o foco/zoom sempre que `regions` muda de identidade.
 */
export function useGlobeRegions(): Region[] {
  const { regions, services } = useGreenData()
  const built = buildRegions(regions, services)
  const signature = JSON.stringify(built)

  const [cache, setCache] = useState({ signature, value: built })
  if (cache.signature !== signature) {
    // padrão "ajustar estado durante o render" do React: sem efeito extra
    setCache({ signature, value: built })
    return built
  }
  return cache.value
}
