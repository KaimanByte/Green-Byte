import { useEffect, useRef, type RefObject } from 'react'
import styles from './Connector.module.css'

type Props = {
  regionCode: string | null
  panelRef: RefObject<HTMLElement | null>
}

export function Connector({ regionCode, panelRef }: Props) {
  const lineRef = useRef<SVGLineElement>(null)

  useEffect(() => {
    if (!regionCode) return

    let frame = 0

    const update = () => {
      const marker = document.querySelector<HTMLElement>(`[data-region="${regionCode}"]`)
      const panel = panelRef.current
      const line = lineRef.current

      if (marker && panel && line) {
        const m = marker.getBoundingClientRect()
        const p = panel.getBoundingClientRect()

        const startX = m.right
        const startY = m.top + m.height / 2
        // acompanha p nao fugir do painel
        const endY = Math.min(Math.max(startY, p.top + 32), p.bottom - 32)

        // esconde a linha caso o marcador estiver atras do globo ou painel
        const isVisible = marker.dataset.visible === 'true' && startX < p.left

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
  }, [regionCode, panelRef])

  if (!regionCode) return null

  return (
    <svg className={styles.connector} aria-hidden="true">
      <line ref={lineRef} />
    </svg>
  )
}