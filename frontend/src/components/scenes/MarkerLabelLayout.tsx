import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  layoutMarkerLabels,
  type LabelSide,
  type MarkerLabelInput,
  type MarkerLabelPlacement,
} from '../../lib/markerLabels'

type LabelSize = { width: number; height: number }

/**
 * Troca de lado em duas etapas: o nome recolhe para dentro do marcador (fio encolhe e texto some),
 * muda de lado e se estende de novo. Precisa bater com a transição de `.label` no CSS.
 */
const SIDE_SWAP_MS = 220

type SideState = {
  /** lado desenhado agora */
  shown: LabelSide
  /** momento em que o nome começou a recolher para trocar de lado; null fora da troca */
  retractingSince: number | null
}

/**
 * Reposiciona os nomes das cidades a cada quadro (o globo gira, então as posições mudam):
 * mantém cada nome dentro da tela e desvia com um cotovelo quando dois nomes ou marcadores
 * se sobrepõem. Não desenha nada na cena; só ajusta os atributos dos marcadores no DOM.
 * O movimento em si (subir, descer, trocar de lado) é animado pelo CSS do RegionMarker.
 * Fica depois dos marcadores na árvore para rodar depois de o drei posicioná-los.
 */
export function MarkerLabelLayout() {
  // largura do nome sem a escala do marcador: o texto não muda, então mede uma vez só
  const sizes = useRef(new Map<string, LabelSize>())
  // resultado do quadro anterior, usado como histerese pelo cálculo
  const previous = useRef(new Map<string, MarkerLabelPlacement>())
  const sides = useRef(new Map<string, SideState>())

  useFrame(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-region]')
    const inputs: MarkerLabelInput[] = []
    const elements = new Map<string, { button: HTMLButtonElement; scale: number }>()

    for (const button of buttons) {
      if (button.dataset.visible !== 'true') continue
      const id = button.dataset.region!
      const label = button.querySelector<HTMLElement>('[data-marker-label]')
      if (!label) continue

      let size = sizes.current.get(id)
      if (!size || size.width === 0) {
        size = { width: label.offsetWidth, height: label.offsetHeight }
        sizes.current.set(id, size)
      }

      const scale = Number.parseFloat(button.style.getPropertyValue('--marker-scale')) || 1
      const rect = button.getBoundingClientRect()
      inputs.push({
        id,
        marker: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
        labelWidth: size.width * scale,
        labelHeight: size.height * scale,
        preferredSide: (button.dataset.preferredSide as LabelSide | undefined) ?? 'left',
        hasLabel: button.getAttribute('aria-pressed') !== 'true',
        previous: previous.current.get(id),
      })
      elements.set(id, { button, scale })
    }

    if (inputs.length === 0) return
    const placements = layoutMarkerLabels(inputs, { width: window.innerWidth, height: window.innerHeight })
    const now = performance.now()

    for (const [id, placement] of placements) {
      previous.current.set(id, placement)
      const element = elements.get(id)
      if (!element) continue
      const { button, scale } = element

      // troca de lado: recolhe, espera a animação, troca e deixa o CSS estender de novo
      let state = sides.current.get(id)
      if (!state) {
        state = { shown: placement.side, retractingSince: null }
        sides.current.set(id, state)
      }
      if (placement.side === state.shown) {
        state.retractingSince = null // desistiu da troca antes de completar: só volta a estender
      } else if (state.retractingSince === null) {
        state.retractingSince = now
      } else if (now - state.retractingSince >= SIDE_SWAP_MS) {
        state.shown = placement.side
        state.retractingSince = null
      }
      const retracting = state.retractingSince !== null ? 'true' : 'false'

      // o desvio é aplicado dentro do marcador, que está escalado: converte de px de tela
      const shift = `${Math.round(placement.shift / scale)}px`
      // só escreve no DOM quando muda, para não reiniciar as transições a cada quadro
      if (button.dataset.labelSide !== state.shown) button.dataset.labelSide = state.shown
      if (button.dataset.labelRetracting !== retracting) button.dataset.labelRetracting = retracting
      if (button.style.getPropertyValue('--label-shift') !== shift) button.style.setProperty('--label-shift', shift)
    }
  })

  return null
}
