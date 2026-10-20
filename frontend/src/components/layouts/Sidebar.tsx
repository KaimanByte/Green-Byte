import { useEffect} from 'react'
import {MenuIcon} from './MenuIcon'
import type { MenuItem } from './menuItems'
import styles from './Sidebar.module.css'

type Props = {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  items: MenuItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Sidebar({ isOpen, onToggle, onClose, items, activeId, onSelect }: Props) 
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
      >
        <h2 className={styles.title}>MENU</h2>

        <ul className={styles.list}>
          {items.map((item) => {
            const isActive = item.id === activeId

            return (
              <li key={item.id}>
                <button
                  type="button"
                 className={`${styles.item} ${isActive ? `liquid ${styles.itemActive}` : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  data-menu-item={item.id}
                  onClick={() => onSelect(item.id)}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>

        <footer className={styles.footer}>
          <span className={styles.footerBrand}>GREENBYTE</span>
          <span className={styles.footerTagline}>Monitoramento ambiental</span>
        </footer>
      </nav>
    </>
  )
}