import { useGreenData } from '../../hooks/useGreenData'
import { formatInterval } from '../../lib/admin'
import { formatTime } from '../../lib/format'
import { RelativeTime } from './RelativeTime'
import styles from './DashboardPanel.module.css'

/**
 * Linha de atualização dos painéis públicos (Dashboard e Serviços): quando foi a última coleta,
 * quando o painel sincronizou com o backend e de quanto em quanto tempo ele se atualiza sozinho.
 * O "há X s" avança a cada segundo, sem esperar a próxima busca de dados.
 */
export function SyncStatus() {
  const { lastCollectionAt, lastSync, refreshIntervalSeconds } = useGreenData()

  return (
    // o "há X s" muda todo segundo: aria-live aqui faria o leitor de tela anunciar sem parar
    <p className={styles.meta}>
      {lastCollectionAt ? (
        <>
          Última coleta <RelativeTime date={lastCollectionAt} /> ({formatTime(lastCollectionAt)})
        </>
      ) : (
        'Nenhuma coleta registrada ainda'
      )}
      {lastSync && ` · sincronizado às ${formatTime(lastSync)} · atualiza a cada ${formatInterval(refreshIntervalSeconds)}`}
    </p>
  )
}
