// brilho que segue o cursor nos botões de vidro (.liquid): grava a posição do mouse
// em --mx/--my (em %) e o reflexo do liquid.css acompanha. um só ouvinte pro site todo,
// no máximo uma atualização por quadro, e só em aparelhos com mouse
export function trackLiquidPointer() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  let target: HTMLElement | null = null
  let x = 0
  let y = 0
  let frame = 0

  const release = () => {
    target?.style.removeProperty('--mx')
    target?.style.removeProperty('--my')
    target = null
  }

  const apply = () => {
    frame = 0
    if (!target) return
    const box = target.getBoundingClientRect()
    if (!box.width || !box.height) return
    target.style.setProperty('--mx', `${((x - box.left) / box.width) * 100}%`)
    target.style.setProperty('--my', `${((y - box.top) / box.height) * 100}%`)
  }

  document.addEventListener(
    'pointermove',
    (event) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>('.liquid') : null
      if (element !== target) release()
      if (!element) return
      target = element
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(apply)
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', release)
}
