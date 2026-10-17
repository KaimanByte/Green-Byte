import type { RefObject } from 'react'
import { getCarbonLevel } from '../../data/regions'
import {
  DASHBOARD_SUMMARY,
  EMISSIONS_HISTORY,
  REGION_EMISSIONS,
  SERVICE_EMISSIONS,
} from '../../data/dashboard'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import { EmissionsChart } from './EmissionsChart'
import base from './RegionPanel.module.css'
import styles from './DashboardPanel.module.css'

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

// acima de 1000 g mostra em kg
function formatCo2(grams: number) {
  return grams >= 1000
    ? { value: decimal.format(grams / 1000), unit: 'kgCO₂e' }
    : { value: integer.format(grams), unit: 'gCO₂e' }
}

export function DashboardPanel({ onClose, panelRef }: Props) {
  const summary = DASHBOARD_SUMMARY
  const totalCo2 = formatCo2(summary.totalCo2Emissions)
  const level = getCarbonLevel(summary.averageIntensity)
  const topEmission = SERVICE_EMISSIONS[0]?.totalCo2Emissions || 1

  return (
    <aside
      ref={panelRef}
      className={`glass ${base.panel} ${styles.panel}`}
      aria-labelledby="dashboard-panel-title"
    >
      <button type="button" className={base.close} onClick={onClose} aria-label="Fechar dashboard">
        ×
      </button>

      <header className={base.header}>
        <h2 id="dashboard-panel-title" className={base.title}>
          Dashboard
        </h2>
        <p className={base.subtitle}>
          Últimas 24 h · {summary.servicesCount} serviços · {summary.regionsCount} regiões
        </p>
      </header>

      <div className={base.divider} />

      {/* ---------- indicadores consolidados ---------- */}
      <dl className={styles.kpis}>
        <div>
          <dt className={base.label}>Energia</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {decimal.format(summary.totalEnergyKwh)}
            </span>
            kWh
          </dd>
        </div>

        <div>
          <dt className={base.label}>Emissões</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>{totalCo2.value}</span>
            {totalCo2.unit}
          </dd>
        </div>

        <div>
          <dt className={base.label}>Intensidade média</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {integer.format(summary.averageIntensity)}
            </span>
            g/kWh
          </dd>
          <dd className={`${base.badge} ${styles.kpiBadge}`} data-level={level.id}>
            <CarbonLevelIcon icon={level.icon} /> {level.label}
          </dd>
        </div>

        <div>
          <dt className={base.label}>Renovável</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {integer.format(summary.renewableShare)}
            </span>
            %
          </dd>
          <dd className={base.bar}>
            <span className={base.barFill} style={{ width: `${summary.renewableShare}%` }} />
          </dd>
        </div>
      </dl>

      {/* ---------- histórico ---------- */}
      <section className={styles.section}>
        <h3 className={base.label}>Emissões por hora</h3>
        <EmissionsChart points={EMISSIONS_HISTORY} />
      </section>

      <div className={styles.columns}>
      {/* ---------- ranking de serviços ---------- */}
      <section className={styles.section}>
        <h3 className={base.label}>Ranking de serviços</h3>
        <ol className={styles.ranking}>
          {SERVICE_EMISSIONS.map((service, index) => {
            const co2 = formatCo2(service.totalCo2Emissions)
            const serviceLevel = getCarbonLevel(service.carbonIntensity)

            return (
              <li key={service.serviceId} className={styles.rankItem}>
                <span className={styles.rankPosition}>{index + 1}</span>
                <div className={styles.rankBody}>
                  <div className={styles.rankRow}>
                    <span className={styles.rankName}>{service.name}</span>
                    <span className={styles.rankValue}>
                      {co2.value} <small>{co2.unit}</small>
                    </span>
                  </div>
                  <div className={styles.rankRow}>
                    <span className={styles.rankRegion} data-level={serviceLevel.id}>
                      <CarbonLevelIcon icon={serviceLevel.icon} /> {service.regionCode}
                    </span>
                    <span className={styles.rankRegion}>
                      {decimal.format(service.totalEnergyKwh)} kWh
                    </span>
                  </div>
                  <span className={`${base.bar} ${styles.rankBar}`}>
                    <span
                      className={base.barFill}
                      style={{ width: `${(service.totalCo2Emissions / topEmission) * 100}%` }}
                    />
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ---------- por região ---------- */}
      <section className={styles.section}>
        <h3 className={base.label}>Emissões por região</h3>
        <ul className={base.services}>
          {REGION_EMISSIONS.map((region) => {
            const co2 = formatCo2(region.totalCo2Emissions)
            const regionLevel = getCarbonLevel(region.carbonIntensity)
            const share = summary.totalCo2Emissions
              ? (region.totalCo2Emissions / summary.totalCo2Emissions) * 100
              : 0

            return (
              <li key={region.regionCode} className={styles.regionItem}>
                <span className={styles.rankRegion} data-level={regionLevel.id}>
                  <CarbonLevelIcon icon={regionLevel.icon} />
                </span>
                <span className={styles.rankName}>{region.city}</span>
                <span className={styles.rankValue}>
                  {co2.value} <small>{co2.unit}</small>
                </span>
                <span className={styles.regionShare}>{integer.format(share)}%</span>
              </li>
            )
          })}
        </ul>
      </section>
      </div>

      <p className={base.source}>
        Fontes: Greener Metrics Aggregator · Greener Carbon Intensity API
      </p>
    </aside>
  )
}
