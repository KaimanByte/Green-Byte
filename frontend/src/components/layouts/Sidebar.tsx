import { useEffect, useState, type CSSProperties } from 'react'
import {MenuIcon} from './MenuIcon'
import { LOGIN_ID, type MenuItem } from './menuItems'
import styles from './Sidebar.module.css'

type Props = {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  items: MenuItem[]
  activeId: string
  onSelect: (id: string) => void
  /** e-mail de quem está logado; sem ele o botão mostra LOGIN */
  userEmail?: string | null
}

export function Sidebar({ isOpen, onToggle, onClose, items, activeId, onSelect, userEmail = null }: Props) 
{
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
            }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            }
    }, [isOpen, onClose])


    const activeIndex = items.findIndex((item) => item.id === activeId)

    // refração da barra só depois que ela termina de abrir (durante a animação
    // o recorte ainda é menor que a barra e a lente apareceria fora dela)
    const [isLensReady, setIsLensReady] = useState(false)
    const [wasOpen, setWasOpen] = useState(isOpen)
    if (isOpen !== wasOpen) {
      setWasOpen(isOpen)
      if (!isOpen) setIsLensReady(false)
    }

    return (
    <>
      {/* fundo desfocado: também fecha o menu ao clicar fora */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <button
        type="button"
        className={`liquid ${styles.toggle}`}
        onClick={onToggle}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
        aria-controls="menu-lateral"
      >
        <span className="liquid__ring" aria-hidden="true" />
        <MenuIcon open={isOpen} />
      </button>

      <nav
        id="menu-lateral"
        className={`glass ${styles.panel} ${isOpen ? styles.open : ''}`}
        aria-label="Menu principal"
        inert={!isOpen}
        data-liquid-lens={isOpen && isLensReady ? 'edge' : undefined}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === 'clip-path' && isOpen) {
            setIsLensReady(true)
          }
        }}
      >
        <h2 className={styles.title}>MENU</h2>

        {/* uma pílula de vidro só, que desliza até o item ativo (em vez de pular) */}
        <div
          className={styles.listWrap}
          style={{ '--active-index': Math.max(activeIndex, 0) } as CSSProperties}
        >
        <span
          className={`liquid ${styles.indicator} ${activeIndex < 0 ? styles.indicatorHidden : ''}`}
          aria-hidden="true"
        />
        <ul className={styles.list}>
          {items.map((item) => {
            const isActive = item.id === activeId
            const Icon = item.icon

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  data-menu-item={item.id}
                  onClick={() => onSelect(item.id)}
                >
                  {Icon ? (
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
                  ) : (
                    <span className={styles.dot} aria-hidden="true" />
                  )}
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
        </div>

        <button
          type="button"
          className={`${styles.login} ${userEmail ? styles.loginUser : ''} ${activeId === LOGIN_ID ? styles.loginActive : ''}`}
          data-menu-item={LOGIN_ID}
          onClick={() => onSelect(LOGIN_ID)}
          aria-label={userEmail ? `Conta: ${userEmail}` : undefined}
          title={userEmail ?? undefined}
          >
            {userEmail ?? 'LOGIN'}
          </button>

        <footer className={styles.footer}>
          <span className={styles.footerBrand}>GREENBYTE</span>
          <span className={styles.footerTagline}>Monitoramento ambiental</span>
        </footer>
      </nav>
    </>
  )
}