import { useMemo, useState } from 'react'
import { useGreenData } from '../../hooks/useGreenData'
import { useTimeSeries } from '../../hooks/useTimeSeries'
import { csvFileName, serviceSeriesCsv } from '../../lib/csv'
import { METRIC_OPTIONS, buildSeries, getMetricOption, type MetricId } from '../../lib/metrics'
import { EmissionsChart } from './EmissionsChart'
import { ExportCsvButton } from './ExportCsvButton'
import base from './RegionPanel.module.css'
import styles from './DashboardPanel.module.css'

type Props = {
  /** sem serviceId: todos os serviços (média de todas as coletas do intervalo) */
  serviceId?: string
  /** nome usado nos textos acessíveis */
  subject?: string
  compact?: boolean
  headingLevel?: 'h3' | 'h4'
  /** mostra "Exportar CSV" com a série do serviço (todas as métricas, não só a do gráfico) */
  csvExport?: { name: string; regionCode: string }
}

/**
 * Seção "evolução": seletor de métrica + gráfico alimentado por GET /collections/timeseries.
 * Cada ponto é a média das coletas gravadas no intervalo — não a soma acumulada do período.
 */
export function EvolutionChart({
  serviceId,
  subject = 'todos os serviços',
  compact = false,
  headingLevel = 'h3',
  csvExport,
}: Props) {
  const [metricId, setMetricId] = useState<MetricId>('co2Emissions')
  const metric = getMetricOption(metricId)
  const series = useTimeSeries(serviceId)
  const { periodId } = useGreenData()
  const Heading = headingLevel

  const points = useMemo(() => {
    if (!series.data) return null
    const { period, bucketSeconds, bucketOrigin } = series.data
    const from = new Date(period.from)
    return buildSeries(
      series.data.points,
      metricId,
      from,
      new Date(period.to),
      bucketSeconds,
      bucketOrigin ? new Date(bucketOrigin) : from,
    )
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
          unit={metric.unit}
          periodMs={
            series.data
              ? new Date(series.data.period.to).getTime() - new Date(series.data.period.from).getTime()
              : 0
          }
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

      {csvExport && series.data && (
        <ExportCsvButton
          label="Exportar CSV"
          description={`evolução de ${csvExport.name} no período, com todas as métricas`}
          fileName={() => csvFileName(['servico', csvExport.name, periodId])}
          content={() => serviceSeriesCsv(csvExport.name, csvExport.regionCode, series.data?.points ?? [])}
        />
      )}
    </section>
  )
}
