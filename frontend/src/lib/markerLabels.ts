/**
 * Posicionamento dos nomes das cidades ao lado dos marcadores do globo.
 *
 * Regras, em ordem:
 * 1. O nome fica do lado preferido do marcador; se ali ele sair da tela, vai para o outro lado
 *    (sempre apontando para o interior da tela).
 * 2. Se o nome bater em outro marcador ou em outro nome já posicionado, o fio sobe ou desce em
 *    linha reta e depois vira 90° na horizontal ("cotovelo"), o que for o menor desvio.
 *
 * Tudo em pixels de tela. Função pura: recebe as medidas e devolve o lado e o desvio vertical.
 */

export type LabelSide = 'left' | 'right'

export type Box = { left: number; top: number; right: number; bottom: number }

export type MarkerLabelInput = {
  id: string
  /** caixa do marcador na tela */
  marker: Box
  /** tamanho do nome (texto + fio) na tela */
  labelWidth: number
  labelHeight: number
  preferredSide: LabelSide
  /** falso quando o nome está escondido (marcador selecionado): o marcador ainda ocupa espaço */
  hasLabel: boolean
  /**
   * Posição do quadro anterior. Serve de histerese: o nome só troca de lado ou de direção
   * quando a vantagem é clara, para não ficar indo e voltando enquanto o globo gira.
   */
  previous?: MarkerLabelPlacement
}

export type MarkerLabelPlacement = {
  side: LabelSide
  /** desvio vertical do nome em px de tela: negativo sobe, positivo desce, 0 sem cotovelo */
  shift: number
}

export type Viewport = { width: number; height: number }

/** distância mínima entre o nome e a borda da tela */
export const LABEL_EDGE_MARGIN = 8
/** folga mínima entre o nome e o que ele contorna */
export const LABEL_GAP = 4
/** tentativas de contornar obstáculos empilhados antes de desistir */
const MAX_STEPS = 6
/** folga extra exigida para voltar ao lado preferido ou inverter o cotovelo */
export const LABEL_HYSTERESIS = 24

const intersects = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

export function labelBox(input: MarkerLabelInput, side: LabelSide, shift: number): Box {
  const centerY = (input.marker.top + input.marker.bottom) / 2 + shift
  const top = centerY - input.labelHeight / 2
  return side === 'left'
    ? { left: input.marker.left - input.labelWidth, right: input.marker.left, top, bottom: top + input.labelHeight }
    : { left: input.marker.right, right: input.marker.right + input.labelWidth, top, bottom: top + input.labelHeight }
}

function chooseSide(input: MarkerLabelInput, viewport: Viewport): LabelSide {
  const roomLeft = input.marker.left - LABEL_EDGE_MARGIN
  const roomRight = viewport.width - LABEL_EDGE_MARGIN - input.marker.right
  const room = { left: roomLeft, right: roomRight }
  const other: LabelSide = input.preferredSide === 'left' ? 'right' : 'left'
  const current = input.previous?.side
  // já está no lado alternativo: só volta ao preferido com folga, e fica onde está enquanto couber
  if (current && current !== input.preferredSide) {
    if (room[input.preferredSide] >= input.labelWidth + LABEL_HYSTERESIS) return input.preferredSide
    if (room[current] >= input.labelWidth) return current
  }
  if (room[input.preferredSide] >= input.labelWidth) return input.preferredSide
  if (room[other] >= input.labelWidth) return other
  // não cabe em nenhum dos lados: fica onde há mais espaço
  return room[other] > room[input.preferredSide] ? other : input.preferredSide
}

/**
 * Procura o menor desvio numa direção (-1 sobe, +1 desce) que livra o nome de todos os obstáculos.
 * Devolve null se o nome sairia da tela antes de ficar livre.
 */
function findShift(
  input: MarkerLabelInput,
  side: LabelSide,
  direction: -1 | 1,
  obstacles: Box[],
  viewport: Viewport,
): number | null {
  let shift = 0
  for (let step = 0; step < MAX_STEPS; step++) {
    const box = labelBox(input, side, shift)
    if (box.top < LABEL_EDGE_MARGIN || box.bottom > viewport.height - LABEL_EDGE_MARGIN) return null
    const hits = obstacles.filter((obstacle) => intersects(box, obstacle))
    if (hits.length === 0) return shift
    shift =
      direction < 0
        ? shift + Math.min(...hits.map((hit) => hit.top)) - LABEL_GAP - box.bottom
        : shift + Math.max(...hits.map((hit) => hit.bottom)) + LABEL_GAP - box.top
  }
  return null
}

/** Escolhe subir ou descer: o menor desvio, mas mantém a direção anterior se a diferença for pequena. */
function pickShift(up: number | null, down: number | null, previousShift: number): number {
  if (up === null && down === null) return 0
  if (up === null) return down!
  if (down === null) return up
  if (previousShift < 0 && Math.abs(up) <= Math.abs(down) + LABEL_HYSTERESIS) return up
  if (previousShift > 0 && Math.abs(down) <= Math.abs(up) + LABEL_HYSTERESIS) return down
  return Math.abs(up) <= Math.abs(down) ? up : down
}

export function layoutMarkerLabels(inputs: MarkerLabelInput[], viewport: Viewport): Map<string, MarkerLabelPlacement> {
  const placements = new Map<string, MarkerLabelPlacement>()
  const placedLabels: Box[] = []

  // de cima para baixo: o de cima sobe e o de baixo fica reto (ou desce), como pedido no desenho
  const ordered = [...inputs].sort((a, b) => a.marker.top + a.marker.bottom - (b.marker.top + b.marker.bottom))

  for (const input of ordered) {
    const side = chooseSide(input, viewport)
    if (!input.hasLabel) {
      placements.set(input.id, { side, shift: 0 })
      continue
    }

    const obstacles = [
      ...inputs.filter((other) => other.id !== input.id).map((other) => other.marker),
      ...placedLabels,
    ]
    const up = findShift(input, side, -1, obstacles, viewport)
    const down = findShift(input, side, 1, obstacles, viewport)
    const shift = pickShift(up, down, input.previous?.shift ?? 0)

    placements.set(input.id, { side, shift: Math.round(shift) })
    placedLabels.push(labelBox(input, side, shift))
  }

  return placements
}
