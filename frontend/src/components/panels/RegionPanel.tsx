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
  const { regions, services, loading } = useGreenData();

  // Função ultra-robusta que remove hífens, underscores, espaços e coloca em minúsculas (ex: 'ca-central' e 'cacentral' viram exatamente a mesma coisa)
  const normalize = (str: string) => String(str || '').toLowerCase().replace(/[-_\s]/g, '').trim();

  const regionIdentifier = normalize((region as any).regionCode || region.code || region.city || '');

  // Procura a região correspondente ignorando diferenças de hífens
  const realRegion = regions?.find((r: any) => {
    const code = normalize(r.regionCode || r.name || '');
    const city = normalize(r.city || '');
    return code === regionIdentifier || city === regionIdentifier || regionIdentifier.includes(code);
  }) || region;
  
  // Normaliza e filtra os serviços associados à região
  const hostedServices = services?.filter((s: any) => {
    const serviceRegion = normalize(s.regionCode || s.region || '');
    return serviceRegion === regionIdentifier || regionIdentifier.includes(serviceRegion) || serviceRegion.includes(regionIdentifier);
  }) || [];

  // Captura correta da intensidade e da percentagem renovável (lendo camelCase ou snake_case)
  const currentIntensity = realRegion.carbonIntensity || realRegion.carbon_intensity || 0;
  const currentRenewable = realRegion.renewableShare || realRegion.renewable_share || region.renewableShare || 0;
  
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
          {realRegion.city || region.city}
        </h2>
        <p className={styles.subtitle}>
          {realRegion.area || region.area} · {realRegion.country || region.country}
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
        ) : hostedServices.length > 0 ? (
          <ul className={styles.services}>
            {hostedServices.map((service: any) => (
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