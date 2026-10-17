import type { RefObject } from 'react'
import { getCarbonLevel } from '../../data/regions'
import {
  DASHBOARD_SUMMARY,
  EMISSIONS_HISTORY,
} from '../../data/dashboard'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import { EmissionsChart } from './EmissionsChart'
import base from './RegionPanel.module.css'
import styles from './DashboardPanel.module.css'
import { RefreshCw } from 'lucide-react'
import { useGreenData } from '../../hooks/useGreenData';

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

// Formatadores de número
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const precise = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

function formatCo2(grams: number) {
  if (grams >= 1000) return { value: decimal.format(grams / 1000), unit: 'kgCO₂e' }
  if (grams > 0 && grams < 1) return { value: precise.format(grams), unit: 'gCO₂e' }
  return { value: integer.format(grams), unit: 'gCO₂e' }
}

export function DashboardPanel({ onClose, panelRef }: Props) {
  // 1. Extração completa dos dados do banco
  const { regions, services, emissions, serviceEmissions, loading, refetch } = useGreenData();

  // 2. Somatório Real de Emissões
  const dbTotalEmissions = emissions?.reduce(
    (acc: number, curr: any) => acc + Number(curr.totalCo2Emissions || 0), 
    0
  ) || 0;

  // 3. Somatório Real de Energia (kWh)
  const dbTotalEnergy = serviceEmissions?.reduce(
    (acc: number, curr: any) => acc + Number(curr.totalEnergyKwh || 0),
    0
  ) || 0;

  // 4. Intensidade Média Real
  const dbAverageIntensity = dbTotalEnergy > 0 ? (dbTotalEmissions / dbTotalEnergy) : 0;

  // 5. Configuração dos mostradores do cabeçalho
  const totalCo2 = formatCo2(dbTotalEmissions);
  const level = getCarbonLevel(dbAverageIntensity);
  const renewableShare = DASHBOARD_SUMMARY.renewableShare; 

  const maxServiceEmission = serviceEmissions.reduce(
    (max: number, service: any) =>
      Math.max(max, Number(service.totalCo2Emissions) || 0),
    0,
  );

  if (loading) {
    return (
      <aside ref={panelRef} className={`glass ${base.panel} ${styles.panel}`}>
        <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
          A sincronizar com o backend...
        </div>
      </aside>
    )
  }

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
          Últimas 24 h · {services?.length || 0} serviços · {regions?.length || 0} regiões
        </p>
                <button type="button" className={styles.refresh} onClick={refetch}>
          <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
          Atualizar dados
        </button>
      </header>

      <div className={base.divider} />

      <dl className={styles.kpis}>
        <div>
          <dt className={base.label}>Energia</dt>
          <dd className={base.data}>
            <span className={`${base.value} ${styles.kpiValue}`}>
              {precise.format(dbTotalEnergy)}
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
              {integer.format(dbAverageIntensity)}
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
              {integer.format(renewableShare)}
            </span>
            %
          </dd>
          <dd className={base.bar}>
            <span className={base.barFill} style={{ width: `${renewableShare}%` }} />
          </dd>
        </div>
      </dl>

      <section className={styles.section}>
        <h3 className={base.label}>Emissões por hora</h3>
        <EmissionsChart points={EMISSIONS_HISTORY} />
      </section>

      <div className={styles.columns}>
      <section className={styles.section}>
        <h3 className={base.label}>Ranking de serviços</h3>
        <ol className={styles.ranking}>
          {serviceEmissions && serviceEmissions.length > 0 ? (
            serviceEmissions.map((serviceData: any, index: number) => {
              const serviceDetails = services?.find((s: any) => s.id === serviceData.serviceId) || {};
              const regionDetails = regions?.find((r: any) => r.regionCode === serviceDetails.regionCode) || {};
              
              const co2 = formatCo2(Number(serviceData.totalCo2Emissions) || 0);
              const serviceLevel = getCarbonLevel(regionDetails.carbonIntensity || 50);

              return (
                <li key={serviceData.serviceId || index} className={styles.rankItem}>
                  <span className={styles.rankPosition}>{index + 1}</span>
                  <div className={styles.rankBody}>
                    <div className={styles.rankRow}>
                      <span className={styles.rankName}>{serviceDetails.name || serviceData.serviceId}</span>
                      <span className={styles.rankValue}>
                        {co2.value} <small>{co2.unit}</small>
                      </span>
                    </div>
                    <div className={styles.rankRow}>
                      <span className={styles.rankRegion} data-level={serviceLevel.id}>
                        <CarbonLevelIcon icon={serviceLevel.icon} /> {serviceDetails.regionCode || 'Desconhecida'}
                      </span>
                      <span className={styles.rankRegion}>
                        {precise.format(Number(serviceData.totalEnergyKwh) || 0)} kWh
                      </span>
                    </div>
                    <span className={`${base.bar} ${styles.rankBar}`}>
                      <span
                        className={base.barFill}
                        style={{
                          width: `${maxServiceEmission > 0
                            ? (Math.max(0, Number(serviceData.totalCo2Emissions) || 0) / maxServiceEmission) * 100
                            : 0}%`,
                        }}
                      />
                    </span>
                  </div>
                </li>
              )
            })
          ) : (
            <li className={styles.rankItem}>Sem dados de serviços registados.</li>
          )}
        </ol>
      </section>

      <section className={styles.section}>
        <h3 className={base.label}>Emissões por região</h3>
        <ul className={base.services}>
          {emissions && emissions.length > 0 ? (
             emissions.map((emissionData: any, index: number) => {
              const regionDetails = regions?.find((r: any) => r.regionCode === emissionData.regionCode) || {};
              
              const co2 = formatCo2(Number(emissionData.totalCo2Emissions) || 0)
              const regionLevel = getCarbonLevel(regionDetails.carbonIntensity || 50)
              
              const share = dbTotalEmissions > 0
                ? (Number(emissionData.totalCo2Emissions) / dbTotalEmissions) * 100
                : 0

              const displayName = regionDetails.city || regionDetails.name || emissionData.regionCode;

              return (
                <li key={emissionData.regionCode || index} className={styles.regionItem}>
                  <span className={styles.rankRegion} data-level={regionLevel.id}>
                    <CarbonLevelIcon icon={regionLevel.icon} />
                  </span>
                  <span className={styles.rankName}>{displayName}</span>
                  <span className={styles.rankValue}>
                    {co2.value} <small>{co2.unit}</small>
                  </span>
                  <span className={styles.regionShare}>{integer.format(share)}%</span>
                </li>
              )
            })
          ) : (
             <li className={styles.regionItem}>
               <span className={styles.rankName}>Nenhuma emissão registada no banco ainda.</span>
             </li>
          )}
        </ul>
      </section>
      </div>

      <p className={base.source}>
        Fontes: GreenER Metrics Aggregator · GreenER Carbon Intensity API
      </p>
    </aside>
  )
}
