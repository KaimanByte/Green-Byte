import styles from './CollectionDate.module.css'
import { useGreenData } from '../../hooks/useGreenData' // Ajuste o caminho relativo se necessário

type Props = {
  date?: Date // Opcional agora, pois podemos usar o do backend
  isHidden?: boolean
}

const short = (text: string) => {
  const clean = text.replace('.', '')
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export function CollectionDate({ date: propDate, isHidden = false }: Props) {
  // Horário da coleta mais recente gravada no banco (GET /collections/service/:id?limit=1)
  const { lastCollectionAt, loading } = useGreenData()

  // a prop só vale se for passada explicitamente; nunca inventa "agora" como data de coleta
  const date = lastCollectionAt ?? propDate ?? null

  if (!date) {
    return (
      <section
        className={`${styles.root} ${isHidden ? styles.hidden : ''}`}
        aria-label="Data da última coleta"
        aria-hidden={isHidden}
      >
        <p className={styles.label}>Última coleta</p>
        <p className={styles.time}>{loading ? 'Carregando…' : 'Sem coletas registradas'}</p>
      </section>
    )
  }

  const weekday = short(date.toLocaleDateString('pt-BR', { weekday: 'short' }))
  const month = short(date.toLocaleDateString('pt-BR', { month: 'short' }))
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <section
      className={`${styles.root} ${isHidden ? styles.hidden : ''}`}
      aria-label="Data da última coleta"
      aria-hidden={isHidden}
    >
      <p className={styles.label}>Última coleta</p>
      <time dateTime={date.toISOString()}>
        <span className={styles.top}>
          <span className={styles.weekday}>{weekday}</span> {month}
        </span>
        <span className={styles.day}>{date.getDate()}</span>
        <span className={styles.time}>às {time}</span>
      </time>
    </section>
  )
}