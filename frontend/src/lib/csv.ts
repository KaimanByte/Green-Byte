import type { CompareDto, TimeSeriesCompareDto, TimeSeriesPointDto } from '../types/api'
import { SERVICE_STATE_LABELS } from './serviceState'

// Exportação para CSV no formato que o Excel em português abre direto: separador ";",
// vírgula decimal e UTF-8 com BOM (sem o BOM, os acentos aparecem quebrados no Excel).

export type CsvCell = string | number | null | undefined

const SEPARATOR = ';'
const LINE_BREAK = '\r\n'

/** Número com vírgula decimal, sem separador de milhar e sem arredondar a precisão útil. */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  return value.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 10 })
}

function formatCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'number') return formatNumber(cell)

  // texto que começa com = + - @ vira fórmula no Excel: o apóstrofo faz ele ficar só texto
  let text = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell
  if (/[";\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

/** Monta o conteúdo do CSV (sem o BOM, que só entra no arquivo baixado). */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(formatCell).join(SEPARATOR)).join(LINE_BREAK) + LINE_BREAK
}

/** Data no horário local, em formato que o Excel reconhece: "2026-11-21 19:05". */
export function formatCsvDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Fuso das datas do CSV ("UTC-03:00"): elas saem no horário local de quem exportou, então o
 * cabeçalho diz qual é, para o arquivo continuar fazendo sentido quando aberto em outro lugar.
 */
export function utcOffsetLabel(date: Pick<Date, 'getTimezoneOffset'> = new Date()): string {
  const offset = -date.getTimezoneOffset() // getTimezoneOffset é positivo a oeste de Greenwich
  const sign = offset < 0 ? '-' : '+'
  const abs = Math.abs(offset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Rótulo de coluna de data com o fuso: "Início do intervalo (UTC-03:00)". */
const withOffset = (label: string, reference?: Date | string) =>
  `${label} (${utcOffsetLabel(reference ? new Date(reference) : new Date())})`

/** Trecho seguro para nome de arquivo: "Fraud Detector" -> "fraud-detector". */
export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'dados'
  )
}

/** Nome do arquivo: "greenbyte-<partes>-<AAAAMMDD-HHMM>.csv". */
export function csvFileName(parts: string[], now: Date = new Date()): string {
  const stamp = formatCsvDate(now).replace(/[-:]/g, '').replace(' ', '-')
  return `greenbyte-${parts.map(slugify).join('-')}-${stamp}.csv`
}

/** Baixa o CSV no navegador. */
export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // dá tempo do navegador iniciar o download antes de liberar o arquivo
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

// ---------- conteúdos exportados ----------

/** Cabeçalho das séries; o fuso vem da data do primeiro intervalo exportado. */
const seriesHeader = (reference?: string) => [
  'Serviço',
  'Região',
  withOffset('Início do intervalo', reference),
  'Coletas',
  'CO₂e médio por coleta (gCO₂e)',
  'Energia média por coleta (kWh)',
  'CPU média (%)',
  'Memória média (GB)',
  'Disco médio (GB)',
]

function seriesRow(name: string, regionCode: string, point: TimeSeriesPointDto): CsvCell[] {
  return [
    name,
    regionCode,
    formatCsvDate(point.timestamp),
    point.collectionsCount,
    Number(point.co2Emissions),
    Number(point.energyKwh),
    Number(point.cpuPercent),
    Number(point.memoryGb),
    Number(point.diskGb),
  ]
}

/**
 * Evolução de um serviço: uma linha por intervalo com coleta, com todas as métricas.
 * Intervalos sem coleta não entram (não viram zero), como no gráfico.
 */
export function serviceSeriesCsv(name: string, regionCode: string, points: TimeSeriesPointDto[]): string {
  return toCsv(
    seriesHeader(points[0]?.timestamp),
    points.map((point) => seriesRow(name, regionCode, point)),
  )
}

/**
 * Evolução comparada: formato longo (uma linha por serviço e intervalo), fácil de filtrar
 * ou virar tabela dinâmica. Serviços na ordem da seleção, intervalos em ordem cronológica.
 */
export function compareSeriesCsv(data: TimeSeriesCompareDto): string {
  return toCsv(
    seriesHeader(data.period.from),
    data.series.flatMap((series) => series.points.map((point) => seriesRow(series.name, series.regionCode, point))),
  )
}

/**
 * Totais da comparação no período (GET /compare). Energia e CO₂e ficam vazios para quem
 * não teve nenhuma coleta no período: o backend manda 0 nesses casos, mas 0 seria um consumo medido.
 */
export function compareTotalsCsv(data: CompareDto): string {
  const from = formatCsvDate(data.period.from)
  const to = formatCsvDate(data.period.to)
  return toCsv(
    [
      'Serviço',
      'ID',
      'Região',
      'Estado atual (última coleta)',
      'Coletas',
      'CO₂e no período (gCO₂e)',
      'Energia no período (kWh)',
      withOffset('Início do período', data.period.from),
      withOffset('Fim do período', data.period.to),
    ],
    data.items.map((item) => {
      // o estado é o atual (última coleta); os totais são o que foi medido no período
      const hasData = item.collectionsCount > 0
      return [
        item.name,
        item.serviceId,
        item.regionCode,
        SERVICE_STATE_LABELS[item.state],
        item.collectionsCount,
        hasData ? Number(item.co2Emissions) : null,
        hasData ? Number(item.energyKwh) : null,
        from,
        to,
      ]
    }),
  )
}
