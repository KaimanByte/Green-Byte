import { useState, type FormEvent, type RefObject } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, getErrorMessage } from '../../services/api'
import base from './RegionPanel.module.css'
import styles from './LoginPanel.module.css'

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

/** Texto do erro de login conforme a resposta de POST /auth/login. */
function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // 401: credenciais erradas (o backend não diz qual das duas, de propósito)
    if (error.status === 401) return 'E-mail ou senha inválidos.'
    // 400: corpo recusado pela validação; as mensagens do DTO já vêm em português
    if (error.status === 400) return error.details.join(' ') || 'Confira o e-mail e a senha informados.'
  }
  return getErrorMessage(error)
}

export function LoginPanel({ onClose, panelRef }: Props) {
  const { user, login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      setPassword('')
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  // logado: o painel mostra a conta e a saída, no lugar do formulário
  if (user) {
    return (
      <aside ref={panelRef} className={`glass ${base.panel} ${styles.panel}`} aria-labelledby="login-panel-title">
        <button type="button" className={base.close} onClick={onClose} aria-label="Fechar login">
          ×
        </button>

        <header className={base.header}>
          <h2 id="login-panel-title" className={base.title}>Conta</h2>
          <p className={base.subtitle}>Área de configuração</p>
        </header>

        <div className={base.divider} />

        <div className={styles.form}>
          <div className={styles.field}>
            <span className={base.label}>Conectado como</span>
            <p className={styles.account} role="status">{user.email}</p>
          </div>

          <button type="button" className={`liquid liquid--tint ${styles.submit}`} onClick={logout}>
            <span className="liquid__ring" aria-hidden="true" />
            <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside ref={panelRef} className={`glass ${base.panel} ${styles.panel}`} aria-labelledby="login-panel-title">
      <button type="button" className={base.close} onClick={onClose} aria-label="Fechar login">
        ×
      </button>

      <header className={base.header}>
        <h2 id="login-panel-title" className={base.title}>Login</h2>
        <p className={base.subtitle}>Área de configuração</p>
      </header>

      <div className={base.divider} />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span className={base.label}>E-mail</span>
          <input
            type="email"
            className={styles.input}
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={base.label}>Senha</span>
          <input
            type="password"
            className={styles.input}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p role="alert" className={styles.error}>{error}</p>}

        <button type="submit" className={`liquid liquid--tint ${styles.submit}`} disabled={isSubmitting}>
          <span className="liquid__ring" aria-hidden="true" />
          <LogIn size={14} strokeWidth={1.75} aria-hidden="true" />
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </aside>
  )
}