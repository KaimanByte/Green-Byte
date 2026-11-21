import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './admin.module.css'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Janela modal sobre o painel (elemento <dialog> nativo: prende o foco e fecha com Esc). */
export function Modal({ title, onClose, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // o Esc fecha só a janela: sem isso o menu lateral (que também escuta Esc) fecharia junto
  const keepEscapeLocal = (event: KeyboardEvent) => {
    if (event.key === 'Escape') event.stopPropagation()
  }

  return (
    <dialog ref={dialogRef} className={styles.modal} aria-labelledby={titleId} onClose={onClose} onKeyDown={keepEscapeLocal}>
      <h3 id={titleId} className={styles.modalTitle}>{title}</h3>
      {children}
    </dialog>
  )
}
