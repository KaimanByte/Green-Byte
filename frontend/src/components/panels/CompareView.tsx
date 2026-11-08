import { useCompare } from '../../hooks/useCompare'
import { formatCo2, precise } from '../../lib/format'
import { SERVICE_STATE_LABELS } from '../../lib/serviceState'
import { CompareChart } from './CompareChart'
import base from './RegionPanel.module.css'
import dash from './DashboardPanel.module.css'
import styles from './ServicesPanel.module.css'

type Props = {
  ids: string[]
  onClear: () => void
}

/**
 * Lado a lado dos serviços selecionados: totais do período (GET /compare), com barras relativas
 * ao maior valor, e a evolução de cada serviço no tempo (GET /collections/timeseries/compare).
 */
export function CompareView({ ids, onClear }: Props) {
  const compare = useCompare(ids)
  const items = compare.data?.items ?? []
  const maxCo2 = items.reduce((max, item) => Math.max(max, Number(item.co2Emissions) || 0), 0)
  const maxEnergy = items.reduce((max, item) => Math.max(max, Number(item.energyKwh) || 0), 0)

  return (
    <section className={styles.compare} aria-labelledby="compare-title">
      <div className={dash.sectionHeader}>
        <h3 id="compare-title" className={base.label}>
          Comparação ({ids.length})
        </h3>
        <button type="button" className={dash.linkButton} onClick={onClear}>
          Limpar seleção
        </button>
      </div>

      {compare.error && !compare.data ? (
        <p role="alert" className={`${dash.chart} ${dash.chartEmpty}`}>
          Não foi possível comparar: {compare.error}{' '}
          <button type="button" className={dash.linkButton} onClick={compare.refetch}>
            Tentar novamente
          </button>
        </p>
      ) : !compare.data ? (
        <div className={`${dash.chart} ${dash.skeletonChart}`} aria-label="Carregando comparação" />
      ) : (
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th scope="col">Serviço</th>
              <th scope="col">CO₂e</th>
              <th scope="col">Energia</th>
              <th scope="col">Coletas</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const co2 = formatCo2(Number(item.co2Emissions) || 0)
              const isActive = item.state === 'active'
              return (
                <tr key={item.serviceId}>
                  <th scope="row">
                    <span className={styles.compareName}>{item.name}</span>
                    <span className={styles.meta}>
                      {item.regionCode}
                      {!isActive && ` · ${SERVICE_STATE_LABELS[item.state]}`}
                    </span>
                  </th>
                  <td>
                    {co2.value} <small>{co2.unit}</small>
                    <span className={`${base.bar} ${styles.compareMeter}`}>
                      <span
                        className={base.barFill}
                        style={{ width: `${maxCo2 > 0 ? ((Number(item.co2Emissions) || 0) / maxCo2) * 100 : 0}%` }}
                      />
                    </span>
                  </td>
                  <td>
                    {precise.format(Number(item.energyKwh) || 0)} <small>kWh</small>
                    <span className={`${base.bar} ${styles.compareMeter}`}>
                      <span
                        className={base.barFill}
                        style={{ width: `${maxEnergy > 0 ? ((Number(item.energyKwh) || 0) / maxEnergy) * 100 : 0}%` }}
                      />
                    </span>
                  </td>
                  <td>{item.collectionsCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <CompareChart ids={ids} />
    </section>
  )
}
