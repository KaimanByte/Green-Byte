import { describe, expect, it } from 'vitest'
import { labelBox, layoutMarkerLabels, LABEL_EDGE_MARGIN, type MarkerLabelInput } from './markerLabels'

const viewport = { width: 375, height: 812 }

// marcador de 56 px com o canto superior esquerdo em (x, y)
const marker = (id: string, x: number, y: number, extra: Partial<MarkerLabelInput> = {}): MarkerLabelInput => ({
  id,
  marker: { left: x, top: y, right: x + 56, bottom: y + 56 },
  labelWidth: 100,
  labelHeight: 16,
  preferredSide: 'left',
  hasLabel: true,
  ...extra,
})

const intersects = (a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

describe('layoutMarkerLabels', () => {
  it('mantém o lado preferido e não desvia quando há espaço', () => {
    const placements = layoutMarkerLabels([marker('a', 200, 300)], viewport)
    expect(placements.get('a')).toEqual({ side: 'left', shift: 0 })
  })

  it('leva o nome para dentro da tela quando ele sairia pela direita', () => {
    const placements = layoutMarkerLabels([marker('toronto', 280, 300, { preferredSide: 'right' })], viewport)
    expect(placements.get('toronto')?.side).toBe('left')
  })

  it('leva o nome para dentro da tela quando ele sairia pela esquerda', () => {
    const placements = layoutMarkerLabels([marker('a', 20, 300)], viewport)
    expect(placements.get('a')?.side).toBe('right')
  })

  it('faz um cotovelo quando dois nomes do mesmo lado se sobreporiam', () => {
    const inputs = [marker('ashburn', 200, 300), marker('toronto', 250, 290)]
    const placements = layoutMarkerLabels(inputs, viewport)
    const boxes = inputs.map((input) => {
      const placement = placements.get(input.id)!
      return labelBox(input, placement.side, placement.shift)
    })

    expect(intersects(boxes[0], boxes[1])).toBe(false)
    // o de cima é quem desvia: sobe em linha reta antes de virar
    expect(placements.get('toronto')!.shift).toBeLessThan(0)
    expect(placements.get('ashburn')!.shift).toBe(0)
  })

  it('não deixa o nome passar por cima de outro marcador', () => {
    const inputs = [marker('esquerda', 100, 300), marker('direita', 170, 300)]
    const placements = layoutMarkerLabels(inputs, viewport)
    const right = inputs[1]
    const box = labelBox(right, placements.get('direita')!.side, placements.get('direita')!.shift)
    expect(intersects(box, inputs[0].marker)).toBe(false)
  })

  it('o marcador selecionado (sem nome) continua sendo um obstáculo', () => {
    const inputs = [marker('selecionado', 150, 300, { hasLabel: false }), marker('vizinho', 220, 300)]
    const placements = layoutMarkerLabels(inputs, viewport)
    expect(placements.get('selecionado')).toEqual({ side: 'left', shift: 0 })
    const box = labelBox(inputs[1], placements.get('vizinho')!.side, placements.get('vizinho')!.shift)
    expect(intersects(box, inputs[0].marker)).toBe(false)
  })

  it('não volta ao lado preferido no limite exato (histerese)', () => {
    // à esquerda cabe por pouco: sem histórico fica à esquerda, mas quem já estava à direita continua lá
    const x = LABEL_EDGE_MARGIN + 100 + 5
    expect(layoutMarkerLabels([marker('a', x, 300)], viewport).get('a')?.side).toBe('left')
    const withPrevious = layoutMarkerLabels([marker('a', x, 300, { previous: { side: 'right', shift: 0 } })], viewport)
    expect(withPrevious.get('a')?.side).toBe('right')
  })

  it('volta ao lado preferido quando há folga de sobra', () => {
    const placements = layoutMarkerLabels([marker('a', 200, 300, { previous: { side: 'right', shift: 0 } })], viewport)
    expect(placements.get('a')?.side).toBe('left')
  })

  it('mantém a direção do cotovelo enquanto a outra não for claramente melhor', () => {
    // sem histórico o de cima sobe; se ele vinha descendo e descer ainda é viável, continua descendo
    const inputs = [marker('ashburn', 200, 300), marker('toronto', 250, 290, { previous: { side: 'left', shift: 10 } })]
    const placements = layoutMarkerLabels(inputs, viewport)
    const toronto = placements.get('toronto')!
    if (toronto.shift !== 0) {
      const box = labelBox(inputs[1], toronto.side, toronto.shift)
      expect(intersects(box, inputs[0].marker)).toBe(false)
    }
  })

  it('não empurra o nome para fora da tela pelo topo', () => {
    const inputs = [marker('baixo', 200, 20), marker('cima', 220, 4)]
    const placements = layoutMarkerLabels(inputs, viewport)
    for (const input of inputs) {
      const placement = placements.get(input.id)!
      expect(labelBox(input, placement.side, placement.shift).top).toBeGreaterThanOrEqual(LABEL_EDGE_MARGIN - 16)
    }
  })
})
