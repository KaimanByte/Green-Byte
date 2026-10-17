import { useEffect, useRef, type RefObject } from 'react'
import styles from './Connector.module.css'

type Props = {
  // seletor do elemento de onde a linha sai (ex: [data-region="br-sudeste"]); null esconde
  anchorSelector: string | null
  panelRef: RefObject<HTMLElement | null>
  // por cima do fundo desfocado do menu (usado pelo dashboard)
  overlay?: boolean
}

export function Connector({ anchorSelector, panelRef, overlay = false }: Props) {
  const lineRef = useRef<SVGLineElement>(null)

  useEffect(() => {
    if (!anchorSelector) return

    let frame = 0

    const update = () => {
      const anchor = document.querySelector<HTMLElement>(anchorSelector)
      const panel = panelRef.current
      const line = lineRef.current

      if (anchor && panel && line) {
        const m = anchor.getBoundingClientRect()
        const p = panel.getBoundingClientRect()

        const startX = m.right
        const startY = m.top + m.height / 2
        // acompanha p nao fugir do painel
        const endY = Math.min(Math.max(startY, p.top + 32), p.bottom - 32)

        // esconde a linha caso o marcador estiver atras do globo ou painel
        const isVisible = anchor.dataset.visible !== 'false' && startX < p.left

        line.setAttribute('x1', String(startX))
        line.setAttribute('y1', String(startY))
        line.setAttribute('x2', String(p.left))
        line.setAttribute('y2', String(endY))
        line.style.opacity = isVisible ? '1' : '0'
      }

      frame = requestAnimationFrame(update)
    }

    update()
    return () => cancelAnimationFrame(frame)
  }, [anchorSelector, panelRef])

  if (!anchorSelector) return null

  return (
    <svg
      className={`${styles.connector} ${overlay ? styles.overlay : ''}`}
      aria-hidden="true"
    >
      <line ref={lineRef} />
    </svg>
  )
}
