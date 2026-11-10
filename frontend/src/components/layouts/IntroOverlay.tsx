import { ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import logo from '../../assets/logo-greenbyte.svg'
import type { IntroPhase } from '../../lib/intro'
import styles from './IntroOverlay.module.css'

type Props = {
  phase: IntroPhase
  onSkip: () => void
}

const SKIP_KEYS = ['Escape', 'Enter', ' ']

// logo no centro enquanto a câmera mostra o sistema solar; some quando começa o zoom
export function IntroOverlay({ phase, onSkip }: Props) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (SKIP_KEYS.includes(event.key)) onSkip()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onSkip])

  return (
    <div className={`${styles.overlay} ${phase === 'hold' ? '' : styles.leaving}`}>
      <div className={styles.vignette} aria-hidden="true" />
      <img
        className={styles.logo}
        src={logo}
        alt="GreenByte · Monitoramento ambiental"
        draggable={false}
      />
      <button type="button" className={`liquid liquid--clear ${styles.skip}`} onClick={onSkip}>
        <span className="liquid__ring" aria-hidden="true" />
        Pular
        <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}
