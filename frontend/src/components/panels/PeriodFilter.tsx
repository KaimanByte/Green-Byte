import { useRef, type KeyboardEvent } from 'react'
import { PERIOD_OPTIONS, type PeriodId } from '../../lib/periods'
import styles from './PeriodFilter.module.css'

type Props = {
  value: PeriodId
  onChange: (id: PeriodId) => void
  disabled?: boolean
}

/** Controle segmentado de vidro. Troca de fato a janela `start`/`end` enviada ao backend. */
export function PeriodFilter({ value, onChange, disabled = false }: Props) {
  const groupRef = useRef<HTMLDivElement>(null)

  // padrão de radiogroup: setas trocam a opção e movem o foco
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const index = PERIOD_OPTIONS.findIndex((option) => option.id === value)
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = PERIOD_OPTIONS[(index + delta + PERIOD_OPTIONS.length) % PERIOD_OPTIONS.length]
    onChange(next.id)
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-period="${next.id}"]`)?.focus()
  }

  return (
    <div
      ref={groupRef}
      className={styles.root}
      role="radiogroup"
      aria-label="Período"
      onKeyDown={handleKeyDown}
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            data-period={option.id}
            className={`${styles.option} ${isActive ? `liquid liquid--tint liquid--static ${styles.active}` : ''}`}
            onClick={() => onChange(option.id)}
            disabled={disabled && !isActive}
            title={option.description}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
