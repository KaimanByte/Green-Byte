// Formatadores compartilhados pelos painéis (pt-BR).

export const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
export const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
export const precise = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
/** 3 algarismos significativos: valores pequenos por coleta (0,000652 kWh) continuam distinguíveis. */
export const significant = new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 3 })

/** gCO₂e → valor + unidade legível (troca para kg a partir de 1000 g). */
export function formatCo2(grams: number): { value: string; unit: string } {
  if (grams >= 1000) return { value: decimal.format(grams / 1000), unit: 'kgCO₂e' }
  if (grams > 0 && grams < 1) return { value: precise.format(grams), unit: 'gCO₂e' }
  // abaixo de 100 g, uma casa decimal ainda faz diferença (ex.: 1,3 g não vira "1")
  if (grams > 0 && grams < 100) return { value: decimal.format(grams), unit: 'gCO₂e' }
  return { value: integer.format(grams), unit: 'gCO₂e' }
}

export function formatCo2Text(grams: number): string {
  const { value, unit } = formatCo2(grams)
  return `${value} ${unit}`
}

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const formatDateTime = (date: Date) =>
  date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Hora para janelas curtas; dia + hora para janelas de vários dias. */
export function formatBucketLabel(date: Date, spanMs: number): string {
  return spanMs > 26 * 3_600_000 ? formatDateTime(date) : formatTime(date)
}

/** "há 2 min", "há 3 h" — para indicar o quão recente é um dado. */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))
  if (seconds < 60) return 'agora há pouco'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `há ${hours} h`
  return `há ${Math.round(hours / 24)} dias`
}
