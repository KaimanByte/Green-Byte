import * as THREE from 'three'

// fases da intro: logo parada com a câmera longe -> zoom até a Terra -> site normal
export type IntroPhase = 'hold' | 'zoom' | 'done'

// quanto tempo a logo fica na tela antes do zoom (ms)
export const INTRO_HOLD_MS = 5000

// 1 com a câmera longe, 0 perto da Terra: controla a troca de luz e o destaque do fundo
export const spaceFade = (cameraDistance: number) =>
  THREE.MathUtils.smoothstep(cameraDistance, 9, 32)
