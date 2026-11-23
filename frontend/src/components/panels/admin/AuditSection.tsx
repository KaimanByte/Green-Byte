import { useCallback, useState } from 'react'
import { RefreshCw, SlidersHorizontal, Users } from 'lucide-react'
import { useFetch } from '../../../hooks/useFetch'
import { describeAuditAction, describeAuditChange, getAuditCategory, type AuditCategory } from '../../../lib/admin'
import { formatDateTime, formatRelative } from '../../../lib/format'
import { getAuditLogs } from '../../../services/adminService'
import styles from './admin.module.css'

type Filter = AuditCategory | 'all'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'settings', label: 'Configuração' },
  { id: 'users', label: 'Usuários' },
]

const AUDIT_LIMIT = 100

/** Auditoria: quem alterou configurações ou usuários, o que mudou e quando. */
export function AuditSection() {
  const fetcher = useCallback((signal: AbortSignal) => getAuditLogs(AUDIT_LIMIT, { signal }), [])
  const { data, loading, error, refetch } = useFetch(fetcher)
  const [filter, setFilter] = useState<Filter>('all')

  const logs = (data ?? []).filter((log) => filter === 'all' || getAuditCategory(log.action) === filter)

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label="Filtrar registros">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.ghost} onClick={refetch} disabled={loading}>
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {error && !data ? (
        <p className={styles.alert} data-tone="bad" role="alert">Não foi possível carregar a auditoria: {error}</p>
      ) : logs.length === 0 ? (
        <p className={styles.empty} role="status">
          {loading && !data ? 'Carregando registros…' : 'Nenhuma alteração registrada ainda.'}
        </p>
      ) : (
        <ol className={styles.timeline}>
          {logs.map((log) => {
            const category = getAuditCategory(log.action)
            const date = new Date(log.createdAt)
            return (
              <li key={log.id} data-category={category}>
                <span className={styles.timelineIcon} aria-hidden="true">
                  {category === 'settings' ? <SlidersHorizontal size={14} strokeWidth={1.75} /> : <Users size={14} strokeWidth={1.75} />}
                </span>
                <div className={styles.timelineBody}>
                  <p className={styles.timelineTitle}>{describeAuditAction(log)}</p>
                  {log.changes.length > 0 && (
                    <ul className={styles.changes}>
                      {log.changes.map((change) => (
                        <li key={change.field}>{describeAuditChange(change)}</li>
                      ))}
                    </ul>
                  )}
                  <p className={styles.timelineMeta}>
                    {log.actorEmail} · <time dateTime={log.createdAt} title={formatDateTime(date)}>{formatRelative(date)}</time>
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <p className={styles.hint}>Mostra as {AUDIT_LIMIT} alterações mais recentes. Senhas nunca são gravadas aqui.</p>
    </div>
  )
}
