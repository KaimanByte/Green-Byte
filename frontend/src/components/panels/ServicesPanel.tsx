import { useMemo, useState, type RefObject } from 'react'
import { ChevronDown, GitCompareArrows, RefreshCw } from 'lucide-react'
import { getCarbonLevel } from '../../data/regions'
import { useGreenData } from '../../hooks/useGreenData'
import { useRanking } from '../../hooks/useRanking'
import { decimal, formatCo2, formatDateTime, formatRelative, precise } from '../../lib/format'
import { getPeriodOption } from '../../lib/periods'
import { SERVICE_STATE_LABELS } from '../../lib/serviceState'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import { CompareView } from './CompareView'
import { EvolutionChart } from './EvolutionChart'
import { PeriodFilter } from './PeriodFilter'
import { PanelSkeleton } from './PanelSkeleton'
import base from './RegionPanel.module.css'
import dash from './DashboardPanel.module.css'
import styles from './ServicesPanel.module.css'

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

type SortKey = 'co2' | 'energy' | 'name'

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'co2', label: 'CO₂e' },
  { id: 'energy', label: 'Energia' },
  { id: 'name', label: 'Nome' },
]

/**
 * Seção "Serviços": todos os serviços do ranking oficial (GET /ranking), com estado,
 * consumo no período, última coleta e comparação entre serviços (GET /compare).
 */
export function ServicesPanel({ onClose, panelRef }: Props) {
  const {
    regions,
    services,
    latestCollections,
    loading,
    error,
    lastSync,
    refetch,
    periodId,
    setPeriodId,
    summary,
  } = useGreenData()
  const periodOption = getPeriodOption(periodId)
  const [sortKey, setSortKey] = useState<SortKey>('co2')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)

  // a ordem por CO₂e/energia vem do próprio backend; "nome" reordena o ranking de CO₂e
  const ranking = useRanking(sortKey === 'energy' ? 'energia' : 'co2e')

  const rows = useMemo(() => {
    const list = (ranking.data?.items ?? []).map((item) => ({
      item,
      service: services.find((s) => s.id === item.serviceId) ?? null,
      region: regions.find((r) => r.regionCode === item.regionCode) ?? null,
      latest: latestCollections.find((c) => c.serviceId === item.serviceId) ?? null,
    }))
    if (sortKey === 'name') list.sort((a, b) => a.item.name.localeCompare(b.item.name, 'pt-BR'))
    return list
  }, [ranking.data, services, regions, latestCollections, sortKey])

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      if (next.length < 2) setIsComparing(false)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds([])
    setIsComparing(false)
  }

  if (loading && !lastSync) {
    return (
      <aside ref={panelRef} className={`glass ${base.panel} ${dash.panel}`} aria-busy="true" aria-label="Serviços carregando">
        <PanelSkeleton title="Serviços" message="Sincronizando com o backend…" />
      </aside>
    )
  }

  if (error && !lastSync) {
    return (
      <aside ref={panelRef} className={`glass ${base.panel} ${dash.panel}`}>
        <button type="button" className={base.close} onClick={onClose} aria-label="Fechar serviços">
          ×
        </button>
        <div role="alert" className={dash.state}>
          <p className={dash.stateTitle}>Não foi possível carregar os serviços.</p>
          <p className={dash.stateText}>{error}</p>
          <button type="button" className={dash.refresh} onClick={refetch}>
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside
      ref={panelRef}
      className={`glass ${base.panel} ${dash.panel}`}
      aria-labelledby="services-panel-title"
      aria-busy={loading || ranking.loading}
    >
      <button type="button" className={base.close} onClick={onClose} aria-label="Fechar serviços">
        ×
      </button>

      <header className={base.header}>
        <h2 id="services-panel-title" className={base.title}>
          Serviços
        </h2>
        <p className={base.subtitle}>
          {ranking.data?.total ?? services.length} monitorados · {periodOption.description}
        </p>
        {summary && (
          <p className={dash.stateCounts}>
            <span data-state="active">{summary.services.active} ativos</span>
            <span data-state="no_metrics">{summary.services.withoutMetrics} sem métricas</span>
            <span data-state="unavailable">{summary.services.unavailable} indisponíveis</span>
          </p>
        )}
        {error && (
          <p role="alert" className={`${base.subtitle} ${dash.warning}`}>
            Falha ao atualizar: {error} (exibindo os últimos dados recebidos)
          </p>
        )}
        <div className={dash.toolbar}>
          <PeriodFilter value={periodId} onChange={setPeriodId} disabled={loading} />
          <button type="button" className={dash.refresh} onClick={refetch} disabled={loading}>
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" className={loading ? dash.spin : undefined} />
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </header>

      <div className={base.divider} />

      {isComparing && selectedIds.length >= 2 && <CompareView ids={selectedIds} onClear={clearSelection} />}

      <div className={styles.sortBar}>
        <span className={base.label} id="services-sort-label">
          Ordenar por
        </span>
        <div className={styles.sortOptions} role="group" aria-labelledby="services-sort-label">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.sortOption} ${sortKey === option.id ? styles.sortActive : ''}`}
              aria-pressed={sortKey === option.id}
              onClick={() => setSortKey(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.compareBar} aria-live="polite">
        <span className={styles.meta}>
          {selectedIds.length === 0
            ? 'Marque 2 ou mais serviços para comparar.'
            : `${selectedIds.length} selecionado${selectedIds.length > 1 ? 's' : ''}`}
        </span>
        <button
          type="button"
          className={dash.refresh}
          disabled={selectedIds.length < 2 || isComparing}
          onClick={() => setIsComparing(true)}
        >
          <GitCompareArrows size={14} strokeWidth={2} aria-hidden="true" />
          Comparar
        </button>
      </div>

      {ranking.error && !ranking.data ? (
        <p role="alert" className={`${dash.chart} ${dash.chartEmpty}`}>
          Não foi possível carregar os serviços: {ranking.error}{' '}
          <button type="button" className={dash.linkButton} onClick={ranking.refetch}>
            Tentar novamente
          </button>
        </p>
      ) : !ranking.data ? (
        <div aria-label="Carregando serviços">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`${dash.skeleton} ${dash.skeletonRow}`} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className={`${dash.chart} ${dash.chartEmpty}`}>Nenhum serviço cadastrado.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map(({ item, service, region, latest }) => {
            const isExpanded = expandedId === item.serviceId
            const isActive = item.state === 'active'
            const isSelected = selectedIds.includes(item.serviceId)
            const level = region ? getCarbonLevel(region.carbonIntensity) : null
            const co2Text = formatCo2(Number(item.co2Emissions) || 0)
            const latestDate = latest ? new Date(latest.timestamp) : null
            const detailId = `service-detail-${item.serviceId}`
            const place = region?.city || region?.region || service?.location.city || service?.location.region

            return (
              <li key={item.serviceId} className={`${styles.item} ${isExpanded ? styles.itemExpanded : ''}`}>
                <div className={styles.rowWrap}>
                  <input
                    type="checkbox"
                    className={styles.check}
                    checked={isSelected}
                    onChange={() => toggleSelected(item.serviceId)}
                    aria-label={`Selecionar ${item.name} para comparar`}
                  />
                  <button
                    type="button"
                    className={styles.row}
                    aria-expanded={isExpanded}
                    aria-controls={detailId}
                    onClick={() => setExpandedId(isExpanded ? null : item.serviceId)}
                  >
                    <span className={styles.rowMain}>
                      <span className={styles.name}>{item.name}</span>
                      <span className={styles.meta}>
                        <span className={dash.rankRegion} data-level={level?.id}>
                          {level && <CarbonLevelIcon icon={level.icon} />}{' '}
                          {place ? `${place} · ` : ''}{item.regionCode}
                        </span>
                      </span>
                    </span>

                    <span className={styles.rowValues}>
                      {isActive ? (
                        <span className={dash.rankValue}>
                          {co2Text.value} <small>{co2Text.unit}</small>
                        </span>
                      ) : (
                        <span className={dash.stateTag} data-state={item.state}>
                          {SERVICE_STATE_LABELS[item.state]}
                        </span>
                      )}
                      <span className={styles.meta}>
                        {isActive ? `${precise.format(Number(item.energyKwh) || 0)} kWh` : '—'}
                      </span>
                    </span>

                    <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className={styles.chevron} />
                  </button>
                </div>

                {isExpanded && (
                  <div id={detailId} className={styles.detail}>
                    <dl className={styles.detailGrid}>
                      <div>
                        <dt className={base.label}>Estado no período</dt>
                        <dd>
                          <span className={dash.stateTag} data-state={item.state}>
                            {SERVICE_STATE_LABELS[item.state]}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className={base.label}>Coletas no período</dt>
                        <dd>{item.collectionsCount}</dd>
                      </div>
                      <div>
                        <dt className={base.label}>Intensidade da região</dt>
                        <dd>{region ? `${region.carbonIntensity} gCO₂e/kWh` : '—'}</dd>
                      </div>
                      <div>
                        <dt className={base.label}>CPU</dt>
                        <dd>{latest ? `${decimal.format(latest.cpuPercent)} %` : '—'}</dd>
                      </div>
                      <div>
                        <dt className={base.label}>Memória</dt>
                        <dd>{latest ? `${decimal.format(latest.memoryGb)} GB` : '—'}</dd>
                      </div>
                      <div>
                        <dt className={base.label}>Disco</dt>
                        <dd>{latest ? `${decimal.format(latest.diskGb)} GB` : '—'}</dd>
                      </div>
                      <div>
                        <dt className={base.label}>Última coleta</dt>
                        <dd title={latestDate ? formatDateTime(latestDate) : undefined}>
                          {latestDate ? formatRelative(latestDate) : 'nenhuma'}
                        </dd>
                      </div>
                    </dl>
                    <p className={styles.detailNote}>CPU, memória e disco referem-se à última coleta, não ao período.</p>

                    <EvolutionChart serviceId={item.serviceId} subject={item.name} compact headingLevel="h4" />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className={base.source}>
        Fontes: GET /ranking · GET /compare · GET /summary · GET /collections/service/:id
      </p>
    </aside>
  )
}
