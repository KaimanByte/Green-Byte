import { useMemo, useState } from 'react'
import { useTimeSeries } from '../../hooks/useTimeSeries'
import { METRIC_OPTIONS, buildSeries, getMetricOption, type MetricId } from '../../lib/metrics'
import { EmissionsChart } from './EmissionsChart'
import base from './RegionPanel.module.css'
import styles from './DashboardPanel.module.css'

type Props = {
  /** sem serviceId: todos os serviços (média de todas as coletas do intervalo) */
  serviceId?: string
  /** nome usado nos textos acessíveis */
  subject?: string
  compact?: boolean
  headingLevel?: 'h3' | 'h4'
}

/**
 * Seção "evolução": seletor de métrica + gráfico alimentado por GET /collections/timeseries.
 * Cada ponto é a média das coletas gravadas no intervalo — não a soma acumulada do período.
 */
export function EvolutionChart({ serviceId, subject = 'todos os serviços', compact = false, headingLevel = 'h3' }: Props) {
  const [metricId, setMetricId] = useState<MetricId>('co2Emissions')
  const metric = getMetricOption(metricId)
  const series = useTimeSeries(serviceId)
  const Heading = headingLevel

  const points = useMemo(() => {
    if (!series.data) return null
    const { period, bucketSeconds } = series.data
    return buildSeries(series.data.points, metricId, new Date(period.from), new Date(period.to), bucketSeconds)
  }, [series.data, metricId])

  const bucketMinutes = series.data ? series.data.bucketSeconds / 60 : null
  const bucketText =
    bucketMinutes === null ? '' : bucketMinutes >= 60 ? `${bucketMinutes / 60} h` : `${bucketMinutes} min`

  return (
    <section className={compact ? undefined : styles.section}>
      <div className={styles.sectionHeader}>
        <Heading className={base.label}>{metric.title}</Heading>
        <div className={styles.metricToggle} role="group" aria-label="Métrica do gráfico">
          {METRIC_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={metricId === option.id}
              className={metricId === option.id ? styles.metricActive : undefined}
              onClick={() => setMetricId(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {series.data && (
        <p className={styles.chartNote}>
          {metric.unit} · média das coletas a cada {bucketText}
          {serviceId ? '' : ' · todos os serviços'}
        </p>
      )}

      {points ? (
        <EmissionsChart
          points={points}
          format={metric.format}
          compact={compact}
          label={`${metric.title}, ${subject}, a cada ${bucketText}`}
        />
      ) : series.error ? (
        <div role="alert" className={`${styles.chart} ${styles.chartEmpty}`}>
          Não foi possível carregar a evolução: {series.error}{' '}
          <button type="button" className={styles.linkButton} onClick={series.refetch}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className={`${styles.chart} ${styles.skeletonChart}`} aria-label="Carregando evolução" />
      )}
    </section>
  )
}
