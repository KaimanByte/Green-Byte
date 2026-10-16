import { useEffect, type RefObject } from 'react'
import { getCarbonLevel, type Region } from '../../data/regions'
import { CarbonLevelIcon } from './CarbonLevelIcon'
import styles from './RegionPanel.module.css'

type Props = {
  region: Region
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

export function RegionPanel({ region, onClose, panelRef }: Props) {
  const level = getCarbonLevel(region.carbonIntensity)

  // Esc fecha o painel
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
          {region.city}
        </h2>
        <p className={styles.subtitle}>
          {region.area} · {region.country}
        </p>
      </header>

      <div className={styles.divider} />

      <dl className={styles.stats}>
        <div>
          <dt className={styles.label}>Intensidade de carbono</dt>
          <dd className={styles.data}>
            <span className={styles.value}>{region.carbonIntensity}</span> gCO₂e/kWh
          </dd>
          <dd className={styles.badge} data-level={level.id}>
            <CarbonLevelIcon icon={level.icon} /> {level.label}
          </dd>
        </div>

        <div>
          <dt className={styles.label}>Energia renovável</dt>
          <dd className={styles.data}>
            <span className={styles.value}>{region.renewableShare}</span>%
          </dd>
          <dd className={styles.bar}>
            <span
              className={styles.barFill}
              style={{ width: `${region.renewableShare}%` }}
            />
          </dd>
        </div>
      </dl>

      <section>
        <h3 className={styles.label}>
          Serviços hospedados ({region.services.length})
        </h3>
        <ul className={styles.services}>
          {region.services.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </section>

      <p className={styles.source}>Fonte: Greener Carbon Intensity API</p>
    </aside>
  )
}