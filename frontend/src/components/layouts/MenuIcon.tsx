import styles from './MenuIcon.module.css'

type Props = { open: boolean }

export function MenuIcon({ open }: Props) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={open ? styles.open : undefined}
    >
      <line className={styles.top} x1="6" y1="9" x2="22" y2="9" />
      <line className={styles.middle} x1="6" y1="14" x2="22" y2="14" />
      <line className={styles.bottom} x1="6" y1="19" x2="22" y2="19" />
    </svg>
  )
}