import { useId } from 'react'
import type { HistoryPoint } from '../../data/dashboard'
import styles from './DashboardPanel.module.css'

type Props = {
  points: HistoryPoint[]
}

const WIDTH = 300
const HEIGHT = 80

const formatHour = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function EmissionsChart({ points }: Props) {
  const gradientId = useId()

  if (points.length < 2) return null

  const values = points.map((p) => p.co2Emissions)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  // deixa uma folga em cima e embaixo pra linha não encostar na borda
  const coords = values.map((value, i) => {
    const x = (i / (values.length - 1)) * WIDTH
    const y = HEIGHT - 6 - ((value - min) / range) * (HEIGHT - 12)
    return [x, y] as const
  })

  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`
  const peakIndex = values.indexOf(max)

  return (
    <figure className={styles.chart}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Emissões por hora. Pico de ${Math.round(max)} gCO₂e às ${formatHour(points[peakIndex].timestamp)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dffc4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3ddc97" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} className={styles.chartLine} />
      </svg>

      <figcaption className={styles.chartAxis}>
        <span>{formatHour(points[0].timestamp)}</span>
        <span>
          pico <strong>{Math.round(max)}</strong> g às {formatHour(points[peakIndex].timestamp)}
        </span>
        <span>{formatHour(points[points.length - 1].timestamp)}</span>
      </figcaption>
    </figure>
  )
}
