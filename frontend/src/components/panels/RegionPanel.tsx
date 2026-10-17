import { useEffect, type RefObject } from 'react'
import { getCarbonLevel, type Region } from '../../data/regions'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import styles from './RegionPanel.module.css'
import { useGreenData } from '../../hooks/useGreenData'

type Props = {
  region: Region
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

export function RegionPanel({ region, onClose, panelRef }: Props) {
  const { regions, services, loading, error } = useGreenData();

  // Função ultra-robusta que remove hífens, underscores, espaços e coloca em minúsculas (ex: 'ca-central' e 'cacentral' viram exatamente a mesma coisa)
  const normalize = (str: string | null | undefined) => String(str ?? '').toLowerCase().replace(/[-_\s]/g, '').trim();

  const regionIdentifier = normalize(region.code || region.city);

  // Procura a região correspondente vinda do backend ignorando diferenças de hífens
  const apiRegion = regions.find((r) => {
    const code = normalize(r.regionCode);
    const city = normalize(r.city);
    return code === regionIdentifier || city === regionIdentifier || (code !== '' && regionIdentifier.includes(code));
  });
  
  // Normaliza e filtra os serviços associados à região
  const hostedServices = services.filter((s) => {
    const serviceRegion = normalize(s.regionCode);
    return serviceRegion === regionIdentifier || (serviceRegion !== '' && (regionIdentifier.includes(serviceRegion) || serviceRegion.includes(regionIdentifier)));
  });

  // Prefere os valores do backend; usa os dados locais do globo como fallback
  const currentIntensity = apiRegion?.carbonIntensity ?? region.carbonIntensity;
  const currentRenewable = apiRegion?.renewableSharePercent ?? region.renewableShare;
  
  const level = getCarbonLevel(currentIntensity);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside
      ref={panelRef}
      className={`glass ${styles.panel}`}
      aria-labelledby="region-panel-title"
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Fechar painel"
      >
        ×
      </button>

      <header className={styles.header}>
        <h2 id="region-panel-title" className={styles.title}>
          {apiRegion?.city || region.city}
        </h2>
        <p className={styles.subtitle}>
          {apiRegion?.region || region.area} · {apiRegion?.country || region.country}
        </p>
      </header>

      <div className={styles.divider} />

      <dl className={styles.stats}>
        <div>
          <dt className={styles.label}>Intensidade de carbono</dt>
          <dd className={styles.data}>
            <span className={styles.value}>{currentIntensity}</span> gCO₂e/kWh
          </dd>
          <dd className={styles.badge} data-level={level.id}>
            <CarbonLevelIcon icon={level.icon} /> {level.label}
          </dd>
        </div>

        <div>
          <dt className={styles.label}>Energia renovável</dt>
          <dd className={styles.data}>
            <span className={styles.value}>{currentRenewable}</span>%
          </dd>
          <dd className={styles.bar}>
            <span
              className={styles.barFill}
              style={{ width: `${currentRenewable}%` }}
            />
          </dd>
        </div>
      </dl>

      <section>
        <h3 className={styles.label}>
          Serviços hospedados ({loading ? '...' : hostedServices.length})
        </h3>
        
        {loading ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            A sincronizar...
          </p>
        ) : error && hostedServices.length === 0 ? (
          <p role="alert" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Não foi possível carregar os serviços: {error}
          </p>
        ) : hostedServices.length > 0 ? (
          <ul className={styles.services}>
            {hostedServices.map((service) => (
              <li key={service.id || service.name}>{service.name || service.id}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Nenhum serviço em execução no momento.
          </p>
        )}
      </section>

      <p className={styles.source}>Fonte: Greener API Automática</p>
    </aside>
  )
}