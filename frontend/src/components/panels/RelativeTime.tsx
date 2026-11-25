import { useNow } from '../../hooks/useNow'
import { formatDateTime, formatRelative } from '../../lib/format'

/**
 * "há 12 s" que continua contando sozinho. Fica num componente próprio para que só este
 * texto seja redesenhado a cada segundo, e não o painel inteiro.
 */
export function RelativeTime({ date }: { date: Date }) {
  const now = useNow()
  return (
    <time dateTime={date.toISOString()} title={formatDateTime(date)}>
      {formatRelative(date, new Date(Math.max(now, date.getTime())))}
    </time>
  )
}
