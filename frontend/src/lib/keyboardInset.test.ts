import { describe, expect, it } from 'vitest'
import { computeKeyboardInset, installKeyboardInset, MIN_KEYBOARD_HEIGHT } from './keyboardInset'

describe('computeKeyboardInset', () => {
  it('mede a parte da janela coberta pelo teclado', () => {
    // 800px de layout, teclado de 300px: sobra 500px visível
    expect(computeKeyboardInset(800, 500, 0)).toBe(300)
  })

  it('desconta a rolagem que o navegador já aplicou à visual viewport', () => {
    expect(computeKeyboardInset(800, 500, 120)).toBe(180)
  })

  it('ignora diferenças pequenas (barra do navegador) e o zoom de pinça', () => {
    expect(computeKeyboardInset(800, 800 - (MIN_KEYBOARD_HEIGHT - 1), 0)).toBe(0)
    expect(computeKeyboardInset(800, 400, 0, 2)).toBe(0)
  })

  it('nunca devolve valor negativo', () => {
    expect(computeKeyboardInset(800, 820, 0)).toBe(0)
  })
})

describe('installKeyboardInset com a API VirtualKeyboard', () => {
  function fakeWindow() {
    const style = new Map<string, string>()
    const keyboard = Object.assign(new EventTarget(), {
      overlaysContent: false,
      boundingRect: { height: 0 } as DOMRect,
    })
    const win = {
      navigator: { virtualKeyboard: keyboard },
      document: {
        documentElement: {
          style: {
            setProperty: (name: string, value: string) => style.set(name, value),
            removeProperty: (name: string) => style.delete(name),
          },
        },
      },
    } as unknown as Window
    return { win, keyboard, style }
  }

  it('faz o teclado sobrepor a página e publica a altura dele em --keyboard-inset', () => {
    const { win, keyboard, style } = fakeWindow()

    const stop = installKeyboardInset(win)
    expect(keyboard.overlaysContent).toBe(true)
    expect(style.get('--keyboard-inset')).toBe('0px')

    keyboard.boundingRect = { height: 291.6 } as DOMRect
    keyboard.dispatchEvent(new Event('geometrychange'))
    expect(style.get('--keyboard-inset')).toBe('292px')

    stop()
    expect(keyboard.overlaysContent).toBe(false)
    expect(style.has('--keyboard-inset')).toBe(false)
  })
})
