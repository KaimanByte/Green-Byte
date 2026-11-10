import { useMemo, useState, type RefObject } from 'react'
import { getCarbonLevel } from '../../data/regions'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import { EvolutionChart } from './EvolutionChart'
import { PeriodFilter } from './PeriodFilter'
import { PanelSkeleton } from './PanelSkeleton'
import base from './RegionPanel.module.css'
import styles from './DashboardPanel.module.css'
import { RefreshCw } from 'lucide-react'
import { useGreenData } from '../../hooks/useGreenData'
import { useRanking } from '../../hooks/useRanking'
import type { RankingMetric } from '../../types/api'
import { SERVICE_STATE_LABELS } from '../../lib/serviceState'
import { formatCo2, formatRelative, formatTime, integer, precise } from '../../lib/format'
import { getPeriodOption } from '../../lib/periods'
import { DASHBOARD_SOURCES } from '../../services/dashboardService'

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

export function DashboardPanel({ onClose, panelRef }: Props) {
  // 1. Extração completa dos dados do banco
  const {
    regions,
    services,
    emissions,
    serviceEmissions,
    loading,
    error,
    failedSources,
    lastSync,
    refetch,
    periodId,
    setPeriodId,
    lastCollectionAt,
    summary,
  } = useGreenData()
  const periodOption = getPeriodOption(periodId)
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('co2e')
  const ranking = useRanking(rankingMetric)

  // 2/3. Totais oficiais do período (GET /summary: só serviços ativos entram na soma).
  //      Sem /summary, soma os agregados por região/serviço. Se a fonte da soma também
  //      falhou (carga parcial), o total fica null e o painel exibe "—", nunca um 0 inventado.
  const servicesFailed = failedSources.includes(DASHBOARD_SOURCES.services)
  const regionsFailed = failedSources.includes(DASHBOARD_SOURCES.regions)
  const emissionsFailed = failedSources.includes(DASHBOARD_SOURCES.emissions)
  const serviceEmissionsFailed = failedSources.includes(DASHBOARD_SOURCES.serviceEmissions)

  const dbTotalEmissions: number | null = summary
    ? Number(summary.totals.co2Emissions) || 0
    : emissionsFailed
      ? null
      : emissions.reduce((acc, curr) => acc + Number(curr.totalCo2Emissions || 0), 0)

  const dbTotalEnergy: number | null = summary
    ? Number(summary.totals.energyKwh) || 0
    : serviceEmissionsFailed
      ? null
      : serviceEmissions.reduce((acc, curr) => acc + Number(curr.totalEnergyKwh || 0), 0)

  // participação de cada região é calculada sobre a soma das próprias regiões
  const regionsTotalEmissions = emissions.reduce(
    (acc, curr) => acc + Number(curr.totalCo2Emissions || 0),
    0
  )

  // 4. Intensidade Média Real (ponderada pela energia de cada coleta)
  const hasEnergy = dbTotalEnergy !== null && dbTotalEnergy > 0 && dbTotalEmissions !== null
  const dbAverageIntensity = hasEnergy ? dbTotalEmissions / dbTotalEnergy : 0

  // 5. Renovável: média do renewableSharePercent das regiões, ponderada pela energia consumida em cada uma.
  //    Sem energia no período não há o que ponderar → null (exibe "—", não um número inventado).
  const renewableShare = useMemo(() => {
    let weighted = 0
    let energy = 0
    for (const item of emissions) {
      const region = regions.find((r) => r.regionCode === item.regionCode)
      const kwh = Number(item.totalEnergyKwh) || 0
      if (!region || kwh <= 0) continue
      weighted += kwh * region.renewableSharePercent
      energy += kwh
    }
    return energy > 0 ? weighted / energy : null
  }, [emissions, regions])

  // 6. Configuração dos mostradores do cabeçalho
  const totalCo2 = dbTotalEmissions !== null ? formatCo2(dbTotalEmissions) : { value: '—', unit: 'gCO₂e' }
  const level = getCarbonLevel(dbAverageIntensity)

  // ranking oficial do backend (GET /ranking): ativos primeiro, em ordem decrescente da métrica
  const rankingItems = ranking.data?.items ?? []
  const metricValue = (item: { energyKwh: number; co2Emissions: number }) =>
    rankingMetric === 'energia' ? Number(item.energyKwh) || 0 : Number(item.co2Emissions) || 0
  const regionRanking = useMemo(
    () =>
      [...emissions].sort(
        (a, b) => (Number(b.totalCo2Emissions) || 0) - (Number(a.totalCo2Emissions) || 0),
      ),
    [emissions],
  )

  const maxRankingValue = rankingItems.reduce((max, item) => Math.max(max, metricValue(item)), 0)

  if (loading && !lastSync) {
    return (
      <aside ref={panelRef} className={`glass ${base.panel} ${styles.panel}`} aria-busy="true" aria-label="Dashboard carregando">
        <PanelSkeleton title="Dashboard" message="Sincronizando com o backend…" />
      </aside>
    )
  }

  // nunca conseguiu carregar: não há dados para exibir
  if (error && !lastSync) {
    return (
      <aside ref={panelRef} className={`glass ${base.panel} ${styles.panel}`}>
        <button type="button" className={base.close} onClick={onClose} aria-label="Fechar dashboard">
          ×
        </button>
        <div role="alert" className={styles.state}>
          <p className={styles.stateTitle}>Não foi possível carregar o dashboard.</p>
          <p className={styles.stateText}>{error}</p>
          <button type="button" className={styles.refresh} onClick={refetch}>
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside
      ref={panelRef}
      className={`glass ${base.panel} ${styles.panel}`}
      aria-labelledby="dashboard-panel-title"
      aria-busy={loading}
    >
      <button type="button" className={base.close} onClick={onClose} aria-label="Fechar dashboard">
        ×
      </button>

      <header className={base.header}>
        <h2 id="dashboard-panel-title" className={base.title}>
          Dashboard
        </h2>
        <p className={base.subtitle}>
          {periodOption.description} · {servicesFailed ? '—' : services.length} serviços ·{' '}
          {regionsFailed ? '—' : regions.length} regiões
        </p>
        {summary && (
          <p className={styles.stateCounts}>
            <span data-state="active">{summary.services.active} ativos</span>
            <span data-state="no_metrics">{summary.services.withoutMetrics} sem métricas</span>
            <span data-state="unavailable">{summary.services.unavailable} indisponíveis</span>
          </p>
        )}
        {error && (
          <p role="alert" className={`${base.subtitle} ${styles.warning}`}>
            Falha ao atualizar: {error} (exibindo os últimos dados recebidos)
          </p>
        )}
        {!error && failedSources.length > 0 && (
          <p role="status" className={`${base.subtitle} ${styles.warning}`}>
            Sem resposta de: {failedSources.join(', ')}. O restante foi carregado normalmente.
          </p>
        )}
        <div className={styles.toolbar}>
          <PeriodFilter value={periodId} onChange={setPeriodId} disabled={loading} />
          <button type="button" className={styles.refresh} onClick={refetch} disabled={loading}>
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" className={loading ? styles.spin : undefined} />
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
        <p className={styles.meta} aria-live="polite">
          {lastCollectionAt
            ? `Última coleta ${formatRelative(lastCollectionAt)} (${formatTime(lastCollectionAt)})`
            : 'Nenhuma coleta registrada ainda'}
          {lastSync && ` · sincronizado às ${formatTime(lastSync)} · atualiza a cada 60 s`}
        </p>
      </header>

      <div className={base.divider} />

      <dl className={styles.kpis}>
        <div className={styles.kpi}>
          <dt className={base.label}>Energia</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {dbTotalEnergy !== null ? precise.format(dbTotalEnergy) : '—'}
            </span>
            kWh
          </dd>
        </div>

        <div className={styles.kpi}>
          <dt className={base.label}>Emissões</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>{totalCo2.value}</span>
            {totalCo2.unit}
          </dd>
        </div>

        <div className={styles.kpi}>
          <dt className={base.label}>Intensidade média</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {hasEnergy ? integer.format(dbAverageIntensity) : '—'}
            </span>
            gCO₂e/kWh
          </dd>
          {hasEnergy && (
            <dd className={`${base.badge} ${styles.kpiBadge}`} data-level={level.id}>
              <CarbonLevelIcon icon={level.icon} /> {level.label}
            </dd>
          )}
        </div>

        <div className={styles.kpi}>
          <dt className={base.label} title="Média da participação renovável de cada região, ponderada pela energia consumida nela">
            Renovável
          </dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {renewableShare !== null ? integer.format(renewableShare) : '—'}
            </span>
            %
          </dd>
          {renewableShare !== null && (
            <dd className={base.bar}>
              <span className={base.barFill} style={{ width: `${renewableShare}%` }} />
            </dd>
          )}
        </div>
      </dl>

      <EvolutionChart />

      <div className={styles.columns}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={base.label}>Ranking de serviços</h3>
          <div className={styles.metricToggle} role="group" aria-label="Métrica do ranking">
            {(['co2e', 'energia'] as const).map((metric) => (
              <button
                key={metric}
                type="button"
                aria-pressed={rankingMetric === metric}
                className={rankingMetric === metric ? styles.metricActive : undefined}
                onClick={() => setRankingMetric(metric)}
              >
                {metric === 'co2e' ? 'CO₂e' : 'Energia'}
              </button>
            ))}
          </div>
        </div>
        {ranking.error && !ranking.data ? (
          <p role="alert" className={`${styles.rankItem} ${styles.emptyItem}`}>
            Não foi possível carregar o ranking: {ranking.error}{' '}
            <button type="button" className={styles.linkButton} onClick={ranking.refetch}>
              Tentar novamente
            </button>
          </p>
        ) : !ranking.data ? (
          <div aria-label="Carregando ranking">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`${styles.skeleton} ${styles.skeletonRow}`} />
            ))}
          </div>
        ) : (
        <ol className={styles.ranking} aria-busy={ranking.loading}>
          {rankingItems.length > 0 ? (
            rankingItems.map((item) => {
              const regionDetails = regions.find((r) => r.regionCode === item.regionCode)
              const isActive = item.state === 'active'
              const co2 = formatCo2(Number(item.co2Emissions) || 0)
              const serviceLevel = regionDetails ? getCarbonLevel(regionDetails.carbonIntensity) : null
              const primary = rankingMetric === 'energia'
                ? { value: precise.format(Number(item.energyKwh) || 0), unit: 'kWh' }
                : co2
              const secondary = rankingMetric === 'energia'
                ? `${co2.value} ${co2.unit}`
                : `${precise.format(Number(item.energyKwh) || 0)} kWh`

              return (
                <li key={item.serviceId} className={`${styles.rankItem} ${isActive ? '' : styles.rankInactive}`}>
                  <span className={styles.rankPosition}>{item.rank}</span>
                  <div className={styles.rankBody}>
                    <div className={styles.rankRow}>
                      <span className={styles.rankName}>{item.name || item.serviceId}</span>
                      {isActive ? (
                        <span className={styles.rankValue}>
                          {primary.value} <small>{primary.unit}</small>
                        </span>
                      ) : (
                        <span className={styles.stateTag} data-state={item.state}>
                          {SERVICE_STATE_LABELS[item.state]}
                        </span>
                      )}
                    </div>
                    <div className={styles.rankRow}>
                      <span className={styles.rankRegion} data-level={serviceLevel?.id}>
                        {serviceLevel && <CarbonLevelIcon icon={serviceLevel.icon} />}{' '}
                        {item.regionCode || 'Região desconhecida'}
                      </span>
                      <span className={styles.rankRegion}>
                        {isActive ? `${secondary} · ${item.collectionsCount} coletas` : 'sem dados no período'}
                      </span>
                    </div>
                    {isActive && (
                      <span className={`${base.bar} ${styles.rankBar}`}>
                        <span
                          className={base.barFill}
                          style={{ width: `${maxRankingValue > 0 ? (metricValue(item) / maxRankingValue) * 100 : 0}%` }}
                        />
                      </span>
                    )}
                  </div>
                </li>
              )
            })
          ) : (
            <li className={`${styles.rankItem} ${styles.emptyItem}`}>Nenhum serviço cadastrado.</li>
          )}
        </ol>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={base.label}>Emissões por região</h3>
        <ul className={base.services}>
          {regionRanking.length > 0 ? (
             regionRanking.map((emissionData, index) => {
              const regionDetails = regions.find((r) => r.regionCode === emissionData.regionCode)

              const co2 = formatCo2(Number(emissionData.totalCo2Emissions) || 0)
              const regionLevel = regionDetails ? getCarbonLevel(regionDetails.carbonIntensity) : null

              const share = regionsTotalEmissions > 0
                ? (Number(emissionData.totalCo2Emissions) / regionsTotalEmissions) * 100
                : 0

              const displayName = regionDetails?.city || regionDetails?.region || emissionData.regionCode

              return (
                <li key={emissionData.regionCode || index} className={styles.regionItem}>
                  <span className={styles.rankRegion} data-level={regionLevel?.id}>
                    {regionLevel && <CarbonLevelIcon icon={regionLevel.icon} />}
                  </span>
                  <span className={styles.rankName} title={regionDetails ? `${regionDetails.carbonIntensity} gCO₂e/kWh` : undefined}>
                    {displayName}
                  </span>
                  <span className={styles.rankValue}>
                    {co2.value} <small>{co2.unit}</small>
                  </span>
                  <span className={styles.regionShare}>{integer.format(share)}%</span>
                </li>
              )
            })
          ) : (
             <li className={styles.regionItem}>
               <span className={styles.rankName}>Nenhuma emissão registrada neste período.</span>
             </li>
          )}
        </ul>
      </section>
      </div>

      <p className={base.source}>
        Estimativa padronizada (não é medição elétrica real) · Fontes: GreenER Metrics Aggregator · GreenER Carbon Intensity API
      </p>
    </aside>
  )
}
