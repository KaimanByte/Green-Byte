// Teclado virtual no celular: em vez de deixar o navegador empurrar a tela inteira para cima
// (o globo junto), medimos a altura do teclado e expomos em `--keyboard-inset`. Só os elementos
// com campo de digitação (busca, folhas dos painéis, janelas) usam essa variável para subir.

/** Abaixo disso a diferença é barra do navegador aparecendo/sumindo, não teclado. */
export const MIN_KEYBOARD_HEIGHT = 80

const CSS_VAR = '--keyboard-inset'

/**
 * Parte da janela coberta pelo teclado, a partir das medidas da visual viewport.
 * Devolve 0 quando a diferença é pequena demais para ser teclado ou quando há zoom de pinça
 * (com zoom a visual viewport também encolhe, sem teclado nenhum).
 */
export function computeKeyboardInset(
  layoutHeight: number,
  viewportHeight: number,
  viewportOffsetTop: number,
  scale = 1,
): number {
  if (scale > 1.01) return 0
  const covered = Math.round(layoutHeight - viewportHeight - viewportOffsetTop)
  return covered >= MIN_KEYBOARD_HEIGHT ? covered : 0
}

/** O teclado só aparece com um campo de texto focado. */
export function isTextEntry(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (element.isContentEditable || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return true
  }
  if (!(element instanceof HTMLInputElement)) return false
  return !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'color', 'file', 'image', 'hidden'].includes(
    element.type,
  )
}

type VirtualKeyboard = EventTarget & { overlaysContent: boolean; boundingRect: DOMRect }

/**
 * Começa a acompanhar o teclado e devolve a função que para.
 * - Chrome/Edge no Android: API VirtualKeyboard. O teclado passa a sobrepor a página (nada
 *   redimensiona nem rola sozinho) e a altura dele chega pronta.
 * - Safari no iPhone e os demais: visualViewport. O navegador ainda rola a página ao focar;
 *   como o campo já sobe sozinho, a rolagem é desfeita.
 */
export function installKeyboardInset(win: Window = window): () => void {
  const root = win.document.documentElement
  const setInset = (px: number) => root.style.setProperty(CSS_VAR, `${px}px`)
  setInset(0)

  const keyboard = (win.navigator as Navigator & { virtualKeyboard?: VirtualKeyboard }).virtualKeyboard
  if (keyboard) {
    keyboard.overlaysContent = true
    const onGeometryChange = () => setInset(Math.round(keyboard.boundingRect.height))
    keyboard.addEventListener('geometrychange', onGeometryChange)
    return () => {
      keyboard.removeEventListener('geometrychange', onGeometryChange)
      keyboard.overlaysContent = false
      root.style.removeProperty(CSS_VAR)
    }
  }

  const viewport = win.visualViewport
  if (!viewport) return () => root.style.removeProperty(CSS_VAR)

  const update = () => {
    const inset = isTextEntry(win.document.activeElement)
      ? computeKeyboardInset(win.innerHeight, viewport.height, viewport.offsetTop, viewport.scale)
      : 0
    setInset(inset)
    // a página não rola (tudo é fixo): qualquer rolagem aqui é o navegador empurrando a tela
    if (inset > 0 && (win.scrollY !== 0 || viewport.offsetTop !== 0)) win.scrollTo(0, 0)
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  win.addEventListener('focusin', update)
  win.addEventListener('focusout', update)
  return () => {
    viewport.removeEventListener('resize', update)
    viewport.removeEventListener('scroll', update)
    win.removeEventListener('focusin', update)
    win.removeEventListener('focusout', update)
    root.style.removeProperty(CSS_VAR)
  }
}
