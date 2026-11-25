// Teclado virtual no celular: em vez de deixar o navegador empurrar a tela inteira para cima
// (o globo junto), medimos a altura do teclado e expomos em `--keyboard-inset`. Só os elementos
// com campo de digitação (busca, folhas dos painéis, janelas) usam essa variável para subir.

/** Abaixo disso a diferença é barra do navegador aparecendo/sumindo, não teclado. */
export const MIN_KEYBOARD_HEIGHT = 80

const CSS_VAR = '--keyboard-inset'

/**
 * Quanto subir os elementos fixos embaixo para ficarem logo acima do teclado: a distância entre
 * o fim da janela e o fim da parte visível (visual viewport), já descontada a rolagem que o
 * navegador aplicou.
 *
 * A presença do teclado é decidida pela altura que ele tira da tela (`layoutHeight - viewportHeight`),
 * e não pelo valor já descontado: no iPhone o Safari rola a tela ao focar o campo, e quanto mais
 * rola, menor fica o desconto. Usar o valor descontado fazia o teclado "não ser detectado" quando
 * o Safari rolava muito, e a busca ficava escondida atrás dele.
 *
 * Devolve 0 sem teclado (diferença pequena = barra do navegador) e com zoom de pinça
 * (com zoom a visual viewport também encolhe, sem teclado nenhum).
 */
export function computeKeyboardInset(
  layoutHeight: number,
  viewportHeight: number,
  viewportOffsetTop: number,
  scale = 1,
): number {
  if (scale > 1.01) return 0
  const keyboardHeight = layoutHeight - viewportHeight
  if (keyboardHeight < MIN_KEYBOARD_HEIGHT) return 0
  return Math.max(0, Math.round(keyboardHeight - viewportOffsetTop))
}

/** Releituras depois de focar/desfocar: o teclado do iPhone abre animado e nem sempre avisa no fim. */
const SETTLE_DELAYS_MS = [100, 300, 600]

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

/**
 * Fecha o teclado virtual tirando o foco do campo de texto ativo.
 * Necessário no iPhone: tocar num botão (menu, marcador, fechar) não tira o foco do campo,
 * porque o Safari não foca botões no toque, e o teclado continuaria aberto por cima da tela.
 */
export function dismissKeyboard(doc: Document = document): void {
  const active = doc.activeElement
  if (isTextEntry(active)) (active as HTMLElement).blur()
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

  // Altura da área onde os elementos fixos (a busca) são posicionados. Medida por um elemento
  // fixo invisível de cima a baixo, e não por `innerHeight`: em algumas versões do Safari no
  // iPhone o `innerHeight` também encolhe quando o teclado abre, a diferença para a parte
  // visível dava zero e a busca ficava atrás do teclado — mas os elementos fixos não sobem sozinhos.
  const probe = win.document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position:fixed;top:0;bottom:0;left:0;width:0;visibility:hidden;pointer-events:none;'
  win.document.body.append(probe)
  const layoutHeight = () => probe.getBoundingClientRect().height || win.innerHeight

  const update = () => {
    const typing = isTextEntry(win.document.activeElement)
    const height = layoutHeight()
    const inset = typing ? computeKeyboardInset(height, viewport.height, viewport.offsetTop, viewport.scale) : 0
    setInset(inset)
    // a página não rola (tudo é fixo): qualquer rolagem aqui é o navegador empurrando a tela.
    // Se o Safari não deixar desfazer, o cálculo acima já compensa a rolagem.
    const keyboardOpen = typing && height - viewport.height >= MIN_KEYBOARD_HEIGHT
    if (keyboardOpen && (win.scrollY !== 0 || viewport.offsetTop !== 0)) win.scrollTo(0, 0)
  }

  // ao focar/desfocar, relê algumas vezes enquanto o teclado termina de abrir ou fechar
  let timers: number[] = []
  const updateWhileSettling = () => {
    update()
    timers.forEach((timer) => win.clearTimeout(timer))
    timers = SETTLE_DELAYS_MS.map((delay) => win.setTimeout(update, delay))
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  win.addEventListener('focusin', updateWhileSettling)
  win.addEventListener('focusout', updateWhileSettling)
  return () => {
    timers.forEach((timer) => win.clearTimeout(timer))
    viewport.removeEventListener('resize', update)
    viewport.removeEventListener('scroll', update)
    win.removeEventListener('focusin', updateWhileSettling)
    win.removeEventListener('focusout', updateWhileSettling)
    probe.remove()
    root.style.removeProperty(CSS_VAR)
  }
}
