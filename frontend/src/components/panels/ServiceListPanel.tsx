import { MapPin, RefreshCw } from 'lucide-react'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import { useServiceViews } from '../../hooks/useServiceViews'
import type { ServiceView } from '../../types/views'
import styles from './ServiceListPanel.module.css'

function ServiceItem({ service }: { service: ServiceView }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemHeader}>
        <span className={styles.name}>{service.name}</span>
        <span className={styles.status}>{service.statusLabel}</span>
      </div>

      <p className={styles.location}>
        <MapPin size={12} strokeWidth={2} aria-hidden="true" />
        {service.locationLabel}
      </p>

      <p className={styles.metrics}>
        {service.hasMetrics ? (
          <>
            {service.energyLabel} · {service.emissionsLabel}
          </>
        ) : (
          'Sem métricas no período'
        )}
        {service.carbonLevel && (
          <span className={styles.level} data-level={service.carbonLevel.id}>
            <CarbonLevelIcon icon={service.carbonLevel.icon} />
            Intensidade {service.carbonLevel.label.toLowerCase()}
          </span>
        )}
      </p>
    </li>
  )
}

/** Listagem dos serviços do backend (GET /services) na tela inicial. */
export function ServiceListPanel() {
  const { state, refreshing, refetch } = useServiceViews()

  const count = state.status === 'ready' ? state.services.length : null

  return (
    <section className={`glass ${styles.panel}`} aria-labelledby="service-list-title">
      <header className={styles.header}>
        <h2 id="service-list-title" className={styles.title}>
          Serviços{count !== null && ` (${count})`}
        </h2>
        <p className={styles.period}>Métricas das últimas 24 h</p>
      </header>

      {state.status === 'loading' && (
        <p className={styles.message} role="status">
          Carregando serviços...
        </p>
      )}

      {state.status === 'error' && (
        <div className={styles.message} role="alert">
          <p>Não foi possível carregar os serviços.</p>
          <p className={styles.detail}>{state.message}</p>
          <button type="button" className={styles.retry} onClick={refetch} disabled={refreshing}>
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            {refreshing ? 'Tentando...' : 'Tentar novamente'}
          </button>
        </div>
      )}

      {state.status === 'empty' && (
        <p className={styles.message}>Nenhum serviço cadastrado no momento.</p>
      )}

      {state.status === 'ready' && (
        <>
          {state.refreshError && (
            <p className={styles.warning} role="alert">
              Falha ao atualizar: {state.refreshError}
            </p>
          )}
          <ul className={styles.list}>
            {state.services.map((service) => (
              <ServiceItem key={service.id} service={service} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
