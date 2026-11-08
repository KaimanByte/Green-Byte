import { useState, type FormEvent, type RefObject } from 'react'
import { LogIn } from 'lucide-react'
import base from './RegionPanel.module.css'
import styles from './LoginPanel.module.css'

type Props = {
  onClose: () => void
  panelRef: RefObject<HTMLElement | null>
}

export function LoginPanel({ onClose, panelRef }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setError(null)
    // AU-01: chamar POST /auth/login aqui quando o backend tiver a rota
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

        <button type="submit" className={`liquid liquid--tint ${styles.submit}`}>
          <span className="liquid__ring" aria-hidden="true" />
          <LogIn size={14} strokeWidth={1.75} aria-hidden="true" />
          Entrar
        </button>
      </form>
    </aside>
  )
}