/**
 * Escala do eixo vertical dos gráficos com valores "redondos" (0 · 0,1 · 0,2 · 0,3, ou
 * 70 · 75 · 80 · 85), para quem olha a linha saber quanto ela vale. Todas as métricas
 * são não negativas, então o eixo nunca desce abaixo de zero.
 */

export type ChartScale = {
  min: number
  max: number
  /** valores marcados no eixo, do menor para o maior (incluem min e max) */
  ticks: number[]
  /** distância entre duas marcas */
  step: number
}

/** Arredonda um passo para 1, 2, 2,5 ou 5 × potência de 10. */
function niceStep(rough: number): number {
  const power = 10 ** Math.floor(Math.log10(rough))
  const fraction = rough / power
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * power
}

/**
 * Escala que cobre [rawMin, rawMax] com cerca de `tickCount` marcas.
 * Com todos os valores iguais, abre uma faixa em volta do valor para a linha não ficar colada na borda.
 */
export function niceScale(rawMin: number, rawMax: number, tickCount = 4): ChartScale {
  let low = Math.max(0, Math.min(rawMin, rawMax))
  let high = Math.max(rawMin, rawMax, 0)
  if (high === low) {
    const spread = high === 0 ? 1 : Math.abs(high) * 0.1
    low = Math.max(0, low - spread)
    high += spread
  }

  const step = niceStep((high - low) / Math.max(1, tickCount - 1))
  // arredondamento de ponto flutuante: 0.30000000000000004 não pode virar uma marca a mais
  const round = (value: number) => Number(value.toPrecision(12))
  const min = round(Math.max(0, Math.floor(low / step + 1e-9) * step))
  const max = round(Math.ceil(high / step - 1e-9) * step)

  const ticks: number[] = []
  for (let value = min; value <= max + step / 2; value += step) ticks.push(round(value))
  return { min, max: ticks[ticks.length - 1], ticks, step }
}

/** Casas decimais necessárias para escrever o passo sem perder precisão (2,5 → 1; 0,02 → 2). */
export function stepDecimals(step: number): number {
  let decimals = 0
  while (decimals < 10 && Math.abs(Math.round(step * 10 ** decimals) - step * 10 ** decimals) > 1e-6) decimals++
  return decimals
}

/** Formata as marcas do eixo com o mesmo número de casas, para ficarem alinhadas. */
export function tickFormatter(step: number): (value: number) => string {
  const decimals = stepDecimals(step)
  const format = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (value) => format.format(value)
}
