// Formatação numérica pt-BR para valores de energia e emissões.

const energyFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})
const gramsFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const kilogramsFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const smallGramsFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

/** Texto exibido quando não há valor para mostrar. */
export const NO_VALUE_LABEL = '—'

/** kWh → "1,80 kWh". */
export function formatEnergyKwh(kwh: number): string {
  return `${energyFormat.format(kwh)} kWh`
}

/** gCO₂e → "152 gCO₂e" (ou "1,5 kgCO₂e" a partir de 1000 g). */
export function formatCo2Emissions(grams: number): string {
  if (grams >= 1000) return `${kilogramsFormat.format(grams / 1000)} kgCO₂e`
  if (grams > 0 && grams < 1) return `${smallGramsFormat.format(grams)} gCO₂e`
  return `${gramsFormat.format(grams)} gCO₂e`
}
