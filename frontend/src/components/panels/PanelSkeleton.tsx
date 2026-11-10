import base from './RegionPanel.module.css'
import styles from './DashboardPanel.module.css'

type Props = {
  title: string
  message: string
}

/** Esqueleto exibido até a primeira resposta do backend (sem números de mentira). */
export function PanelSkeleton({ title, message }: Props) {
  return (
    <>
      <header className={base.header}>
        <h2 className={base.title}>{title}</h2>
        <p className={base.subtitle} role="status">
          {message}
        </p>
      </header>
      <div className={base.divider} />
      <div className={styles.kpis} aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={styles.kpi}>
            <span className={`${styles.skeleton} ${styles.skeletonLabel}`} />
            <span className={`${styles.skeleton} ${styles.skeletonValue}`} />
          </div>
        ))}
      </div>
      <div className={`${styles.chart} ${styles.skeletonChart} ${styles.section}`} aria-hidden="true" />
      <div className={styles.section} aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={`${styles.skeleton} ${styles.skeletonRow}`} />
        ))}
      </div>
    </>
  )
}
