import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { Check, KeyRound, Minus, Search, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useFetch } from '../../../hooks/useFetch'
import {
  PERMISSION_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_ORDER,
  can,
  type Permission,
} from '../../../lib/admin'
import { ApiError, getErrorMessage } from '../../../services/api'
import { createUser, deleteUser, getUsers, updateUser, type UpdateUserInput } from '../../../services/adminService'
import type { UserDto, UserRole } from '../../../types/api'
import { Modal } from './Modal'
import styles from './admin.module.css'

type Props = {
  currentUserId: number
  notify: (tone: 'ok' | 'bad', message: string) => void
}

type RoleFilter = UserRole | 'all'
type StatusFilter = 'all' | 'active' | 'inactive'

type Dialog =
  | { kind: 'create' }
  | { kind: 'password'; user: UserDto }
  | { kind: 'delete'; user: UserDto }
  | null

const MIN_PASSWORD_LENGTH = 8
const PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

/** Mensagem do backend (regra de negócio ou validação) quando houver; senão a genérica. */
function describeError(error: unknown): string {
  if (error instanceof ApiError && error.details.length > 0) return error.details.join(' ')
  if (error instanceof ApiError && error.status === 403) return 'Seu papel não permite esta ação.'
  return getErrorMessage(error)
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function RoleCards({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <fieldset className={styles.roleCards}>
      <legend className={styles.label}>Papel</legend>
      {ROLE_ORDER.map((role) => (
        <label key={role} className={styles.roleCard}>
          <input type="radio" name="role" value={role} checked={value === role} onChange={() => onChange(role)} />
          <span>
            <strong>{ROLE_LABELS[role]}</strong>
            <span className={styles.hint}>{ROLE_DESCRIPTIONS[role]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

/** Gestão de usuários: lista com busca e filtros, papel, ativação, senha e exclusão. */
export function UsersSection({ currentUserId, notify }: Props) {
  const fetcher = useCallback((signal: AbortSignal) => getUsers({ signal }), [])
  const { data, loading, error, refetch } = useFetch(fetcher)
  const users = useMemo(() => data ?? [], [data])

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  // formulários das janelas
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('operator')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openDialog = (next: Dialog) => {
    setEmail('')
    setPassword('')
    setRole('operator')
    setFormError(null)
    setDialog(next)
  }
  const closeDialog = () => setDialog(null)

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return users.filter(
      (user) =>
        (text === '' || user.email.toLowerCase().includes(text)) &&
        (roleFilter === 'all' || (user.role ?? 'operator') === roleFilter) &&
        (statusFilter === 'all' || (statusFilter === 'active') === (user.active !== false)),
    )
  }, [users, query, roleFilter, statusFilter])

  const activeCount = users.filter((user) => user.active !== false).length
  const adminCount = users.filter((user) => user.role === 'admin' && user.active !== false).length

  /** Alteração direto na linha (papel ou ativação). */
  const patchUser = async (user: UserDto, changes: UpdateUserInput, successMessage: string) => {
    setBusyId(user.id)
    try {
      await updateUser(user.id, changes)
      notify('ok', successMessage)
    } catch (patchError) {
      notify('bad', describeError(patchError))
    } finally {
      setBusyId(null)
      refetch()
    }
  }

  const submitDialog = async (event: FormEvent) => {
    event.preventDefault()
    if (!dialog || isSubmitting) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      if (dialog.kind === 'create') {
        await createUser({ email: email.trim(), password, role })
        notify('ok', `Usuário ${email.trim()} criado como ${ROLE_LABELS[role]}.`)
      } else if (dialog.kind === 'password') {
        await updateUser(dialog.user.id, { password })
        notify('ok', `Senha de ${dialog.user.email} redefinida.`)
      } else {
        await deleteUser(dialog.user.id)
        notify('ok', `Usuário ${dialog.user.email} excluído.`)
      }
      closeDialog()
      refetch()
    } catch (submitError) {
      setFormError(describeError(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH

  return (
    <div className={styles.stack}>
      <div className={styles.summary}>
        <p><strong>{users.length}</strong> usuários</p>
        <p><strong>{activeCount}</strong> ativos</p>
        <p><strong>{adminCount}</strong> administradores ativos</p>
        <button type="button" className={`liquid liquid--tint ${styles.primary}`} onClick={() => openDialog({ kind: 'create' })}>
          <span className="liquid__ring" aria-hidden="true" />
          <UserPlus size={14} strokeWidth={1.75} aria-hidden="true" />
          Novo usuário
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <Search size={15} strokeWidth={1.75} aria-hidden="true" />
          <input
            className={styles.input}
            type="search"
            placeholder="Buscar por e-mail"
            aria-label="Buscar usuário por e-mail"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.segmented} role="group" aria-label="Filtrar por papel">
          <button type="button" aria-pressed={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>Todos</button>
          {ROLE_ORDER.map((item) => (
            <button key={item} type="button" aria-pressed={roleFilter === item} onClick={() => setRoleFilter(item)}>
              {ROLE_LABELS[item]}
            </button>
          ))}
        </div>
        <div className={styles.segmented} role="group" aria-label="Filtrar por situação">
          <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Todas</button>
          <button type="button" aria-pressed={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Ativas</button>
          <button type="button" aria-pressed={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>Desativadas</button>
        </div>
      </div>

      {error && users.length === 0 ? (
        <p className={styles.alert} data-tone="bad" role="alert">
          Não foi possível carregar os usuários: {error}
          <button type="button" className={styles.link} onClick={refetch}>tentar de novo</button>
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>Usuários do sistema</caption>
            <thead>
              <tr>
                <th scope="col">Usuário</th>
                <th scope="col">Papel</th>
                <th scope="col">Situação</th>
                <th scope="col">Criado em</th>
                <th scope="col"><span className={styles.srOnly}>Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => {
                const isSelf = user.id === currentUserId
                const isActive = user.active !== false
                const isBusy = busyId === user.id
                const userRole = user.role ?? 'operator'

                return (
                  <tr key={user.id} data-inactive={!isActive}>
                    <th scope="row">
                      <span className={styles.userCell}>
                        <span className={styles.avatar} aria-hidden="true">{user.email.charAt(0).toUpperCase()}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                        {isSelf && <span className={styles.badge} data-tone="idle">você</span>}
                      </span>
                    </th>
                    <td>
                      <select
                        className={styles.select}
                        aria-label={`Papel de ${user.email}`}
                        value={userRole}
                        disabled={isSelf || isBusy}
                        title={isSelf ? 'Você não pode mudar o próprio papel' : undefined}
                        onChange={(event) => {
                          const next = event.target.value as UserRole
                          void patchUser(user, { role: next }, `${user.email} agora é ${ROLE_LABELS[next]}.`)
                        }}
                      >
                        {ROLE_ORDER.map((item) => (
                          <option key={item} value={item}>{ROLE_LABELS[item]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className={styles.switch} title={isSelf ? 'Você não pode desativar a própria conta' : undefined}>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={isActive}
                          disabled={isSelf || isBusy}
                          aria-label={`Conta de ${user.email} ativa`}
                          onChange={(event) =>
                            void patchUser(
                              user,
                              { active: event.target.checked },
                              event.target.checked ? `Conta de ${user.email} reativada.` : `Conta de ${user.email} desativada. O acesso foi cortado.`,
                            )
                          }
                        />
                        <span className={styles.switchTrack} aria-hidden="true" />
                        <span className={styles.badge} data-tone={isActive ? 'ok' : 'bad'}>{isActive ? 'Ativa' : 'Desativada'}</span>
                      </label>
                    </td>
                    <td className={styles.muted}>{formatDate(user.createdAt)}</td>
                    <td>
                      <span className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={`Redefinir a senha de ${user.email}`}
                          title="Redefinir senha"
                          onClick={() => openDialog({ kind: 'password', user })}
                        >
                          <KeyRound size={15} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          data-danger="true"
                          aria-label={`Excluir ${user.email}`}
                          title={isSelf ? 'Você não pode excluir a própria conta' : 'Excluir usuário'}
                          disabled={isSelf}
                          onClick={() => openDialog({ kind: 'delete', user })}
                        >
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className={styles.empty} role="status">
              {loading && users.length === 0
                ? 'Carregando usuários…'
                : users.length === 0
                  ? 'Nenhum usuário cadastrado.'
                  : 'Nenhum usuário corresponde à busca e aos filtros.'}
            </p>
          )}
        </div>
      )}

      {/* ---------- matriz de permissões ---------- */}
      <details className={styles.card}>
        <summary className={styles.cardTitle}>
          <ShieldCheck size={16} strokeWidth={1.75} aria-hidden="true" />
          O que cada papel pode fazer
        </summary>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.matrix}`}>
            <thead>
              <tr>
                <th scope="col">Permissão</th>
                {ROLE_ORDER.map((item) => (
                  <th key={item} scope="col">{ROLE_LABELS[item]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr key={permission}>
                  <th scope="row">{PERMISSION_LABELS[permission]}</th>
                  {ROLE_ORDER.map((item) => (
                    <td key={item}>
                      {can(item, permission) ? (
                        <Check size={15} strokeWidth={2.25} className={styles.yes} aria-label="Sim" />
                      ) : (
                        <Minus size={15} strokeWidth={1.75} className={styles.muted} aria-label="Não" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>As mesmas regras são aplicadas no servidor: esconder um botão não é o que protege a ação.</p>
      </details>

      {/* ---------- janelas ---------- */}
      {dialog?.kind === 'create' && (
        <Modal title="Novo usuário" onClose={closeDialog}>
          <form className={styles.modalForm} onSubmit={submitDialog}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-user-email">E-mail</label>
              <input id="new-user-email" className={styles.input} type="email" required autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-user-password">Senha inicial</label>
              <input
                id="new-user-password"
                className={styles.input}
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                aria-describedby="new-user-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p id="new-user-password-hint" className={passwordTooShort ? styles.fieldError : styles.hint}>Pelo menos {MIN_PASSWORD_LENGTH} caracteres.</p>
            </div>
            <RoleCards value={role} onChange={setRole} />
            {formError && <p className={styles.fieldError} role="alert">{formError}</p>}
            <footer className={styles.actions}>
              <button type="button" className={styles.ghost} onClick={closeDialog}>Cancelar</button>
              <button type="submit" className={`liquid liquid--tint ${styles.primary}`} disabled={isSubmitting}>
                <span className="liquid__ring" aria-hidden="true" />
                {isSubmitting ? 'Criando…' : 'Criar usuário'}
              </button>
            </footer>
          </form>
        </Modal>
      )}

      {dialog?.kind === 'password' && (
        <Modal title="Redefinir senha" onClose={closeDialog}>
          <form className={styles.modalForm} onSubmit={submitDialog}>
            <p className={styles.modalText}>Nova senha para <strong>{dialog.user.email}</strong>. A senha atual deixa de funcionar.</p>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reset-password">Nova senha</label>
              <input
                id="reset-password"
                className={styles.input}
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                aria-describedby="reset-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p id="reset-password-hint" className={passwordTooShort ? styles.fieldError : styles.hint}>Pelo menos {MIN_PASSWORD_LENGTH} caracteres.</p>
            </div>
            {formError && <p className={styles.fieldError} role="alert">{formError}</p>}
            <footer className={styles.actions}>
              <button type="button" className={styles.ghost} onClick={closeDialog}>Cancelar</button>
              <button type="submit" className={`liquid liquid--tint ${styles.primary}`} disabled={isSubmitting}>
                <span className="liquid__ring" aria-hidden="true" />
                {isSubmitting ? 'Salvando…' : 'Redefinir senha'}
              </button>
            </footer>
          </form>
        </Modal>
      )}

      {dialog?.kind === 'delete' && (
        <Modal title="Excluir usuário?" onClose={closeDialog}>
          <form className={styles.modalForm} onSubmit={submitDialog}>
            <p className={styles.modalText}>
              <strong>{dialog.user.email}</strong> perde o acesso e o cadastro é apagado. Não dá para desfazer. Para um
              bloqueio temporário, desative a conta em vez de excluir.
            </p>
            {formError && <p className={styles.fieldError} role="alert">{formError}</p>}
            <footer className={styles.actions}>
              <button type="button" className={styles.ghost} onClick={closeDialog}>Cancelar</button>
              <button type="submit" className={styles.danger} disabled={isSubmitting}>
                <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                {isSubmitting ? 'Excluindo…' : 'Excluir usuário'}
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  )
}
