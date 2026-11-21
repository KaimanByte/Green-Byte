import { useSyncExternalStore } from 'react'

/** Mesmo ponto de quebra das folhas de estilo (@media (max-width: 760px)). */
export const COMPACT_LAYOUT_QUERY = '(max-width: 760px)'

/** `true` enquanto a media query casar; re-renderiza só quando o resultado muda. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
