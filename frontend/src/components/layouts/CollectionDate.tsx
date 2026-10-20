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
  // Puxa o horário real da última sincronização do backend
  const { lastSync } = useGreenData()
  
  // Prioriza a data do hook (tempo real do Cron), mas aceita prop se fornecida
  const date = lastSync || propDate || new Date()

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