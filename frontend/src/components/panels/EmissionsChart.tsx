import { useId, useState, type KeyboardEvent } from 'react'
import { formatBucketLabel } from '../../lib/format'
import type { SeriesPoint } from '../../lib/metrics'
import styles from './DashboardPanel.module.css'

type Props = {
  /** série em ordem cronológica; `value: null` = intervalo sem coleta (vira lacuna) */
  points: SeriesPoint[]
  /** formata um valor com a unidade da métrica, ex: "0,04 gCO₂e" */
  format: (value: number) => string
  /** descrição acessível do que o gráfico mostra */
  label?: string
  /** versão baixa, sem eixo (detalhe de um serviço) */
  compact?: boolean
}

const WIDTH = 300
const HEIGHT = 80
const PAD_Y = 6

/**
 * Linha da evolução de uma métrica no tempo. Cada ponto é a média das coletas de um intervalo
 * (GET /collections/timeseries). Intervalos sem coleta quebram a linha em vez de virarem zero.
 */
export function EmissionsChart({ points, format, label = 'Evolução da métrica', compact = false }: Props) {
  const gradientId = useId()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const present = points.filter((p): p is SeriesPoint & { value: number } => p.value !== null)

  // sem nenhuma coleta no período: estado vazio honesto, sem linha "zerada" que pareça medição
  if (points.length < 2 || present.length === 0) {
    return (
      <figure className={`${styles.chart} ${styles.chartEmpty}`}>
        <figcaption>Sem coletas registradas neste período.</figcaption>
      </figure>
    )
  }

  const span = points[points.length - 1].timestamp.getTime() - points[0].timestamp.getTime()
  const values = present.map((p) => p.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  // escala pela faixa real dos dados (com folga), para a variação aparecer; o eixo mostra min/máx
  const pad = (rawMax - rawMin) * 0.1 || Math.abs(rawMax) * 0.1 || 1
  const min = Math.max(0, rawMin - pad)
  const max = rawMax + pad
  const step = WIDTH / (points.length - 1)

  const xOf = (i: number) => i * step
  const yOf = (value: number) => HEIGHT - PAD_Y - ((value - min) / (max - min)) * (HEIGHT - 2 * PAD_Y)

  // trechos contínuos (sem lacuna) viram linhas separadas
  const segments: { i: number; x: number; y: number }[][] = []
  let current: { i: number; x: number; y: number }[] = []
  points.forEach((point, i) => {
    if (point.value === null) {
      if (current.length) segments.push(current)
      current = []
      return
    }
    current.push({ i, x: xOf(i), y: yOf(point.value) })
  })
  if (current.length) segments.push(current)

  const toPath = (segment: { x: number; y: number }[]) =>
    segment.map(({ x, y }, k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const peak = present.reduce((best, p) => (p.value > best.value ? p : best), present[0])
  const latest = present[present.length - 1]
  const gaps = points.length - present.length

  const active = activeIndex !== null ? points[activeIndex] : null
  const activeLeft = activeIndex !== null ? (activeIndex / (points.length - 1)) * 100 : 0

  // setas percorrem só os intervalos que têm coleta
  const presentIndexes = points.flatMap((p, i) => (p.value === null ? [] : [i]))
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const forward = event.key === 'ArrowRight'
      setActiveIndex((index) => {
        if (index === null) return forward ? presentIndexes[0] : presentIndexes[presentIndexes.length - 1]
        const next = forward
          ? presentIndexes.find((i) => i > index)
          : [...presentIndexes].reverse().find((i) => i < index)
        return next ?? index
      })
    } else if (event.key === 'Escape') {
      setActiveIndex(null)
    }
  }

  return (
    <figure
      className={`${styles.chart} ${compact ? styles.chartCompact : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => setActiveIndex(null)}
      aria-label={`${label}. Último valor ${format(latest.value)}; pico de ${format(peak.value)} em ${formatBucketLabel(peak.timestamp, span)}${gaps ? `; ${gaps} intervalos sem coleta` : ''}. Use as setas para ver cada ponto.`}
    >
      <div className={styles.chartPlot} onPointerLeave={() => setActiveIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dffc4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity="0" />
            </linearGradient>
          </defs>
          {segments.map((segment, k) =>
            segment.length > 1 ? (
              <g key={k}>
                <path
                  d={`${toPath(segment)} L${segment[segment.length - 1].x.toFixed(1)},${HEIGHT} L${segment[0].x.toFixed(1)},${HEIGHT} Z`}
                  fill={`url(#${gradientId})`}
                />
                <path d={toPath(segment)} className={styles.chartLine} />
              </g>
            ) : (
              // ponto isolado entre lacunas: marca visível em vez de sumir
              <line
                key={k}
                className={styles.chartLine}
                x1={segment[0].x}
                x2={segment[0].x}
                y1={segment[0].y - 1.5}
                y2={segment[0].y + 1.5}
                strokeWidth={4}
                strokeLinecap="round"
              />
            ),
          )}
          {activeIndex !== null && (
            <line className={styles.chartCursor} x1={xOf(activeIndex)} x2={xOf(activeIndex)} y1={0} y2={HEIGHT} />
          )}
          {/* faixas invisíveis: cada uma ativa o tooltip do intervalo mais próximo */}
          {points.map((_, i) => (
            <rect
              key={i}
              x={Math.max(0, xOf(i) - step / 2)}
              y={0}
              width={step}
              height={HEIGHT}
              fill="transparent"
              onPointerEnter={() => setActiveIndex(i)}
            />
          ))}
        </svg>

        {active && (
          <div
            className={styles.chartTooltip}
            style={{ left: `clamp(60px, ${activeLeft}%, calc(100% - 60px))` }}
            role="status"
          >
            <span className={styles.chartTooltipTime}>{formatBucketLabel(active.timestamp, span)}</span>
            {active.value !== null ? (
              <>
                <strong>{format(active.value)}</strong>
                <span>
                  média de {active.collectionsCount} coleta{active.collectionsCount === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <strong>sem coleta</strong>
            )}
          </div>
        )}
      </div>

      {!compact && (
        <figcaption className={styles.chartAxis}>
          <span>{formatBucketLabel(points[0].timestamp, span)}</span>
          <span>
            eixo {format(min)} – {format(max)} · pico <strong>{format(peak.value)}</strong>
          </span>
          <span>{formatBucketLabel(points[points.length - 1].timestamp, span)}</span>
        </figcaption>
      )}
    </figure>
  )
}
