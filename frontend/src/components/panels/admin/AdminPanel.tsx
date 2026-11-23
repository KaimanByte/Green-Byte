import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { CircleAlert, CircleCheck, History, Server, Timer, Users, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useFetch } from '../../../hooks/useFetch'
import { useGreenData } from '../../../hooks/useGreenData'
import { ROLE_LABELS, can } from '../../../lib/admin'
import { formatDateTime } from '../../../lib/format'
import { notifyCollectionIntervalChanged } from '../../../lib/collectionRefresh'
import { ApiError, getErrorMessage } from '../../../services/api'
import { getSettings, updateSettings } from '../../../services/adminService'
import type { SettingsValues } from '../../../types/api'
import base from '../RegionPanel.module.css'
import dash from '../DashboardPanel.module.css'
import { AuditSection } from './AuditSection'
import { CollectionSection } from './CollectionSection'
import { MachineSection } from './MachineSection'
import { UsersSection } from './UsersSection'
import styles from './admin.module.css'

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

type TabId = 'collection' | 'machine' | 'users' | 'audit'
type Toast = { id: number; tone: 'ok' | 'bad'; message: string }

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'collection', label: 'Tempo de coleta', icon: Timer },
  { id: 'machine', label: 'Dados da máquina', icon: Server },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'audit', label: 'Auditoria', icon: History },
]

const TOAST_MS = 5_000

/** Área administrativa: tempo de coleta, dados da máquina, usuários e auditoria. */
export function AdminPanel({ onClose, panelRef }: Props) {
  const { user } = useAuth()
  const { services } = useGreenData()
  const role = user?.role
  const canEdit = can(role, 'editSettings')

  const tabs = TABS.filter(
    (tab) => (tab.id !== 'users' || can(role, 'manageUsers')) && (tab.id !== 'audit' || can(role, 'viewAudit')),
  )
  const [selectedTab, setSelectedTab] = useState<TabId>('collection')
  const activeTab = tabs.some((tab) => tab.id === selectedTab) ? selectedTab : 'collection'

  const fetcher = useCallback((signal: AbortSignal) => getSettings({ signal }), [])
  const { data: settings, loading, error, refetch } = useFetch(fetcher)

  /* ---------- avisos (toasts) ---------- */
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<number[]>([])
  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const notify = useCallback((tone: Toast['tone'], message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, tone, message }])
    timersRef.current.push(window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_MS))
  }, [])

  const saveSettings = useCallback(
    async (changes: Partial<SettingsValues>, successMessage: string) => {
      try {
        const updated = await updateSettings(changes)
        if (changes.collectionIntervalSeconds !== undefined) {
          notifyCollectionIntervalChanged(updated.collectionIntervalSeconds)
        }
        notify('ok', successMessage)
        refetch()
        return true
      } catch (saveError) {
        const details = saveError instanceof ApiError && saveError.details.length > 0 ? saveError.details.join(' ') : getErrorMessage(saveError)
        notify('bad', `Não foi possível salvar. ${details}`)
        return false
      }
    },
    [notify, refetch],
  )

  // setas esquerda/direita trocam de aba (padrão de abas acessíveis)
  const moveTab = (direction: 1 | -1) => {
    const index = tabs.findIndex((tab) => tab.id === activeTab)
    const next = tabs[(index + direction + tabs.length) % tabs.length]
    setSelectedTab(next.id)
    document.getElementById(`admin-tab-${next.id}`)?.focus()
  }

  return (
    <aside ref={panelRef} className={`glass ${base.panel} ${dash.panel} ${styles.panel}`} aria-labelledby="admin-panel-title">
      <button type="button" className={base.close} onClick={onClose} aria-label="Fechar administração">
        ×
      </button>

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Área administrativa</p>
          <h2 id="admin-panel-title" className={base.title}>Administração</h2>
        </div>
        {user && (
          <p className={styles.identity}>
            <span className={styles.badge} data-tone="idle">{role ? ROLE_LABELS[role] : 'Sem acesso'}</span>
            <span className={styles.muted}>{user.email}</span>
          </p>
        )}
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Seções da administração">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={isActive}
              aria-controls="admin-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSelectedTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') moveTab(1)
                if (event.key === 'ArrowLeft') moveTab(-1)
              }}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div id="admin-tabpanel" role="tabpanel" aria-labelledby={`admin-tab-${activeTab}`} className={styles.tabPanel}>
        {activeTab === 'users' && user ? (
          <UsersSection currentUserId={user.id} notify={notify} />
        ) : activeTab === 'audit' ? (
          <AuditSection />
        ) : !settings ? (
          error ? (
            <p className={styles.alert} data-tone="bad" role="alert">
              <CircleAlert size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>
                Não foi possível carregar a configuração: {error}{' '}
                <button type="button" className={styles.link} onClick={refetch}>tentar de novo</button>
              </span>
            </p>
          ) : (
            <p className={styles.empty} role="status">{loading ? 'Carregando configuração…' : 'Sem configuração.'}</p>
          )
        ) : activeTab === 'collection' ? (
          // a chave recria a seção (e limpa o rascunho) quando chega uma configuração nova do servidor
          <CollectionSection key={settings.updatedAt} settings={settings} servicesCount={services.length} canEdit={canEdit} onSave={saveSettings} />
        ) : (
          <MachineSection key={settings.updatedAt} settings={settings} canEdit={canEdit} onSave={saveSettings} />
        )}

        {settings && (activeTab === 'collection' || activeTab === 'machine') && (
          <p className={base.source}>Última alteração da configuração: {formatDateTime(new Date(settings.updatedAt))}.</p>
        )}
      </div>

      <div className={styles.toasts} aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className={styles.toast} data-tone={toast.tone} role={toast.tone === 'bad' ? 'alert' : 'status'}>
            {toast.tone === 'ok' ? (
              <CircleCheck size={16} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {toast.message}
          </p>
        ))}
      </div>
    </aside>
  )
}
