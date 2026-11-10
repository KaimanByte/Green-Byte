import { useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { MAX_COMPARE_SERIES, useCompareTimeSeries } from '../../hooks/useTimeSeries'
import { formatBucketLabel } from '../../lib/format'
import { METRIC_OPTIONS, buildSeries, getMetricOption, type MetricId, type SeriesPoint } from '../../lib/metrics'
import base from './RegionPanel.module.css'
import dash from './DashboardPanel.module.css'
import styles from './CompareChart.module.css'

type Props = {
  /** serviços selecionados, na ordem da seleção */
  ids: string[]
}

const WIDTH = 300
const HEIGHT = 100
const PAD_Y = 6

/**
 * Cores das linhas sobre o vidro escuro, em ordem de contraste: as primeiras (as que aparecem
 * nas comparações mais comuns, de 2 a 4 serviços) são as mais distantes entre si.
 */
const PALETTE = [
  '#7dffc4', // menta
  '#ffb86b', // laranja
  '#6cb8ff', // azul
  '#ff7ab6', // rosa
  '#ffe66d', // amarelo
  '#b69cff', // violeta
  '#ff6b6b', // vermelho
  '#e2e8f0', // cinza claro
  '#2dd4bf', // turquesa
  '#bef264', // lima
]

/**
 * Cor estável por serviço: cada serviço que entra na comparação recebe a primeira cor livre e
 * fica com ela enquanto estiver selecionado — adicionar ou remover outro serviço não troca a
 * cor de quem já está no gráfico. A cor de quem sai volta a ficar livre.
 */
function assignColorSlots(ids: string[], previous: Record<string, number>): Record<string, number> {
  const slots: Record<string, number> = {}
  for (const id of ids) {
    if (previous[id] !== undefined) slots[id] = previous[id]
  }
  for (const id of ids) {
    if (slots[id] !== undefined) continue
    const used = new Set(Object.values(slots))
    let slot = 0
    while (used.has(slot)) slot++
    slots[id] = slot
  }
  return slots
}

function sameSlots(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

type Line = {
  serviceId: string
  name: string
  color: string
  /** quantidade de intervalos com coleta */
  total: number
  points: SeriesPoint[]
}

/**
 * Comparação histórica: uma linha por serviço selecionado, todas no mesmo eixo de tempo
 * (GET /collections/timeseries/compare). Cada ponto é a média das coletas DAQUELE serviço
 * no intervalo — nada é somado entre serviços nem acumulado no tempo. Intervalos sem coleta
 * quebram a linha do serviço em vez de virarem zero.
 */
export function CompareChart({ ids }: Props) {
  const [metricId, setMetricId] = useState<MetricId>('co2Emissions')
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const metric = getMetricOption(metricId)
  const compare = useCompareTimeSeries(ids)
  const tooMany = ids.length > MAX_COMPARE_SERIES

  // cores guardadas entre renderizações (estado derivado das props, padrão "ajustar estado
  // quando a prop muda" da documentação do React): só atualiza quando a seleção muda
  const [colorSlots, setColorSlots] = useState<Record<string, number>>(() => assignColorSlots(ids, {}))
  const nextSlots = assignColorSlots(ids, colorSlots)
  if (!sameSlots(nextSlots, colorSlots)) setColorSlots(nextSlots)
  const lines = useMemo<Line[] | null>(() => {
    if (!compare.data) return null
    const { period, bucketSeconds, series } = compare.data
    const from = new Date(period.from)
    const to = new Date(period.to)
    return series.map((s) => ({
      serviceId: s.serviceId,
      name: s.name,
      color: PALETTE[(colorSlots[s.serviceId] ?? 0) % PALETTE.length],
      total: s.total,
      points: buildSeries(s.points, metricId, from, to, bucketSeconds),
    }))
  }, [compare.data, metricId, colorSlots])

  const bucketMinutes = compare.data ? compare.data.bucketSeconds / 60 : null
  const bucketText =
    bucketMinutes === null ? '' : bucketMinutes >= 60 ? `${bucketMinutes / 60} h` : `${bucketMinutes} min`

  const toggleHidden = (id: string) =>
    setHiddenIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  return (
    <section className={styles.section} aria-labelledby="compare-chart-title">
      <div className={dash.sectionHeader}>
        <h4 id="compare-chart-title" className={base.label}>
          Evolução comparada · {metric.title}
        </h4>
        <div className={dash.metricToggle} role="group" aria-label="Métrica da comparação">
          {METRIC_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={metricId === option.id}
              className={metricId === option.id ? dash.metricActive : undefined}
              onClick={() => setMetricId(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {compare.data && (
        <p className={dash.chartNote}>
          {metric.unit} · média das coletas de cada serviço a cada {bucketText} · uma linha por serviço
        </p>
      )}

      {tooMany ? (
        <p className={`${dash.chart} ${dash.chartEmpty}`}>
          Selecione no máximo {MAX_COMPARE_SERIES} serviços para ver a evolução comparada.
        </p>
      ) : lines ? (
        <>
          <CompareLines
            lines={lines}
            hiddenIds={hiddenIds}
            highlightId={highlightId}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            format={metric.format}
            label={`${metric.title} por serviço, a cada ${bucketText}`}
          />
          <ul className={styles.legend} aria-label="Serviços no gráfico">
            {lines.map((line) => {
              const isEmpty = line.total === 0
              const isVisible = !isEmpty && !hiddenIds.includes(line.serviceId)
              const latest = [...line.points].reverse().find((p) => p.value !== null)
              return (
                <li key={line.serviceId}>
                  <button
                    type="button"
                    className={styles.legendItem}
                    style={{ '--line-color': line.color } as CSSProperties}
                    aria-pressed={isVisible}
                    disabled={isEmpty}
                    onClick={() => toggleHidden(line.serviceId)}
                    onPointerEnter={() => isVisible && setHighlightId(line.serviceId)}
                    onPointerLeave={() => setHighlightId(null)}
                    onFocus={() => isVisible && setHighlightId(line.serviceId)}
                    onBlur={() => setHighlightId(null)}
                    title={isEmpty ? undefined : isVisible ? 'Ocultar linha' : 'Mostrar linha'}
                  >
                    <span className={styles.swatch} aria-hidden="true" />
                    <span className={styles.legendName}>{line.name}</span>
                    <span className={styles.legendValue}>
                      {isEmpty
                        ? 'sem coletas no período'
                        : latest?.value != null
                          ? `último ${metric.format(latest.value)}`
                          : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className={styles.hint}>
            Clique em um serviço da legenda para ocultar ou mostrar a linha. Marque ou desmarque serviços na lista
            para adicionar ou remover da comparação.
          </p>
        </>
      ) : compare.error ? (
        <div role="alert" className={`${dash.chart} ${dash.chartEmpty}`}>
          Não foi possível carregar a evolução comparada: {compare.error}{' '}
          <button type="button" className={dash.linkButton} onClick={compare.refetch}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className={`${dash.chart} ${dash.skeletonChart}`} aria-label="Carregando evolução comparada" />
      )}
    </section>
  )
}

type LinesProps = {
  lines: Line[]
  hiddenIds: string[]
  highlightId: string | null
  activeIndex: number | null
  onActiveIndexChange: (index: number | null) => void
  format: (value: number) => string
  label: string
}

function CompareLines({ lines, hiddenIds, highlightId, activeIndex, onActiveIndexChange, format, label }: LinesProps) {
  const withData = lines.filter((line) => line.total > 0)
  const visible = withData.filter((line) => !hiddenIds.includes(line.serviceId))
  const grid = lines[0]?.points ?? []

  if (withData.length === 0 || grid.length < 2) {
    return (
      <figure className={`${dash.chart} ${dash.chartEmpty}`}>
        <figcaption>Nenhum dos serviços selecionados tem coletas neste período.</figcaption>
      </figure>
    )
  }
  if (visible.length === 0) {
    return (
      <figure className={`${dash.chart} ${dash.chartEmpty}`}>
        <figcaption>Todas as linhas estão ocultas. Clique em um serviço da legenda para exibi-lo.</figcaption>
      </figure>
    )
  }

  const span = grid[grid.length - 1].timestamp.getTime() - grid[0].timestamp.getTime()
  const values = visible.flatMap((line) => line.points.flatMap((p) => (p.value === null ? [] : [p.value])))
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin) * 0.1 || Math.abs(rawMax) * 0.1 || 1
  const min = Math.max(0, rawMin - pad)
  const max = rawMax + pad
  const step = WIDTH / (grid.length - 1)

  const xOf = (i: number) => i * step
  const yOf = (value: number) => HEIGHT - PAD_Y - ((value - min) / (max - min)) * (HEIGHT - 2 * PAD_Y)

  const segmentsOf = (points: SeriesPoint[]) => {
    const segments: { x: number; y: number }[][] = []
    let current: { x: number; y: number }[] = []
    points.forEach((point, i) => {
      if (point.value === null) {
        if (current.length) segments.push(current)
        current = []
        return
      }
      current.push({ x: xOf(i), y: yOf(point.value) })
    })
    if (current.length) segments.push(current)
    return segments
  }
  const toPath = (segment: { x: number; y: number }[]) =>
    segment.map(({ x, y }, k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  // setas percorrem só os intervalos em que alguma linha visível tem coleta
  const presentIndexes = grid.flatMap((_, i) => (visible.some((line) => line.points[i].value !== null) ? [i] : []))
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const forward = event.key === 'ArrowRight'
      let next: number | undefined
      if (activeIndex === null) next = forward ? presentIndexes[0] : presentIndexes[presentIndexes.length - 1]
      else
        next = forward
          ? presentIndexes.find((i) => i > activeIndex)
          : [...presentIndexes].reverse().find((i) => i < activeIndex)
      onActiveIndexChange(next ?? activeIndex)
    } else if (event.key === 'Escape') {
      onActiveIndexChange(null)
    }
  }

  const index = activeIndex !== null && activeIndex < grid.length ? activeIndex : null
  const activeLeft = index !== null ? (index / (grid.length - 1)) * 100 : 0
  const activeRows =
    index === null
      ? []
      : visible
          .map((line) => ({ line, point: line.points[index] }))
          .sort((a, b) => (b.point.value ?? -Infinity) - (a.point.value ?? -Infinity))

  const summary = visible
    .map((line) => {
      const present = line.points.filter((p): p is SeriesPoint & { value: number } => p.value !== null)
      const peak = present.reduce((best, p) => (p.value > best.value ? p : best), present[0])
      return peak ? `${line.name}: pico de ${format(peak.value)} em ${formatBucketLabel(peak.timestamp, span)}` : ''
    })
    .filter(Boolean)
    .join('; ')

  return (
    <figure
      className={`${dash.chart} ${styles.chart}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => onActiveIndexChange(null)}
      aria-label={`${label}. ${summary}. Use as setas para ver cada intervalo.`}
    >
      <div className={dash.chartPlot} onPointerLeave={() => onActiveIndexChange(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} className={styles.gridLine} x1={0} x2={WIDTH} y1={HEIGHT * f} y2={HEIGHT * f} />
          ))}
          {visible.map((line) => {
            const dimmed = highlightId !== null && highlightId !== line.serviceId
            const strong = highlightId === line.serviceId
            return (
              <g
                key={line.serviceId}
                className={`${styles.series} ${dimmed ? styles.seriesDimmed : ''} ${strong ? styles.seriesStrong : ''}`}
                style={{ '--line-color': line.color } as CSSProperties}
              >
                {segmentsOf(line.points).map((segment, k) =>
                  segment.length > 1 ? (
                    <path key={k} d={toPath(segment)} className={styles.line} />
                  ) : (
                    // ponto isolado entre lacunas: marca curta em vez de sumir
                    <line
                      key={k}
                      className={styles.line}
                      x1={segment[0].x}
                      x2={segment[0].x}
                      y1={segment[0].y - 1.5}
                      y2={segment[0].y + 1.5}
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  ),
                )}
              </g>
            )
          })}
          {index !== null && <line className={dash.chartCursor} x1={xOf(index)} x2={xOf(index)} y1={0} y2={HEIGHT} />}
          {grid.map((_, i) => (
            <rect
              key={i}
              x={Math.max(0, xOf(i) - step / 2)}
              y={0}
              width={step}
              height={HEIGHT}
              fill="transparent"
              onPointerEnter={() => onActiveIndexChange(i)}
            />
          ))}
        </svg>

        {/* marcadores em HTML: no SVG esticado (preserveAspectRatio=none) um círculo viraria elipse */}
        {index !== null &&
          activeRows.map(({ line, point }) =>
            point.value === null ? null : (
              <span
                key={line.serviceId}
                className={styles.dot}
                style={
                  {
                    '--line-color': line.color,
                    left: `${activeLeft}%`,
                    top: `${(yOf(point.value) / HEIGHT) * 100}%`,
                  } as CSSProperties
                }
              />
            ),
          )}

        {index !== null && (
          <div
            className={`${dash.chartTooltip} ${styles.tooltip}`}
            // desloca o tooltip na proporção do cursor: à esquerda ele abre para a direita e
            // vice-versa, então nunca sai do gráfico, qualquer que seja a largura
            style={{ left: `${activeLeft}%`, transform: `translateX(-${activeLeft}%)` }}
            role="status"
          >
            <span className={dash.chartTooltipTime}>{formatBucketLabel(grid[index].timestamp, span)}</span>
            {activeRows.map(({ line, point }) => (
              <span
                key={line.serviceId}
                className={styles.tooltipRow}
                style={{ '--line-color': line.color } as CSSProperties}
              >
                <span className={styles.swatch} aria-hidden="true" />
                <span className={styles.tooltipName}>{line.name}</span>
                {point.value !== null ? (
                  <strong>
                    {format(point.value)}
                    <small>
                      {' '}
                      · {point.collectionsCount} coleta{point.collectionsCount === 1 ? '' : 's'}
                    </small>
                  </strong>
                ) : (
                  <em>sem coleta</em>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <figcaption className={dash.chartAxis}>
        <span>{formatBucketLabel(grid[0].timestamp, span)}</span>
        <span>
          eixo {format(min)} – {format(max)}
        </span>
        <span>{formatBucketLabel(grid[grid.length - 1].timestamp, span)}</span>
      </figcaption>
    </figure>
  )
}
