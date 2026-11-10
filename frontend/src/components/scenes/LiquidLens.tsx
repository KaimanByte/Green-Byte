import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// refração do vidro líquido feita no WebGL (funciona em qualquer navegador):
// depois que a cena é desenhada, copia o pedaço da tela que fica atrás de cada
// botão .liquid e redesenha esse pedaço distorcido, como uma lente de água.
// cada lente é só um retângulo pequeno: custo bem baixo, mesmo em PC sem placa de vídeo

// botões que ganham a lente: os marcadores do globo ficam de fora (mexem a cada quadro)
// e os botões dentro de painéis/menu também (o fundo deles já é o vidro do painel).
// superfícies grandes (ex.: barra do menu) entram com data-liquid-lens="edge":
// distorcem só numa faixa fina da borda e não ondulam, pro texto ficar legível
const LENS_SELECTOR = '.liquid:not([data-region]), [data-liquid-lens]'
const MAX_LENSES = 8
// a posição dos botões é relida a cada N quadros (ler layout todo quadro custa caro)
const MEASURE_EVERY = 3

// força da distorção (ajuste aqui)
const BEND = 0.55 // quanto a borda "puxa" o fundo, em fração da faixa da borda
const EDGE = 0.85 // largura da faixa que distorce, em fração do meio-lado menor
const WAVE = 1.6 // ondulação de água no meio do vidro, em pixels de CSS
const CHROMA = 0.12 // separação de cor nas bordas (aberração cromática)
const EDGE_SURFACE = 0.22 // faixa da borda nas superfícies grandes (data-liquid-lens="edge")

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec4 rect;      // x, y, largura, altura em pixels do canvas (origem embaixo)
  uniform float radius;   // raio da borda arredondada, em pixels do canvas
  uniform vec2 origin;    // canto do pedaço copiado da tela
  uniform vec2 texSize;   // tamanho do pedaço copiado
  uniform float bend;
  uniform float edge;
  uniform float wave;
  uniform float chroma;
  uniform float time;
  uniform float opacity;

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  vec3 sampleAt(vec2 px) {
    vec2 uv = clamp((px - origin) / texSize, vec2(0.0), vec2(1.0));
    return texture2D(map, uv).rgb;
  }

  void main() {
    vec2 px = gl_FragCoord.xy;
    vec2 halfSize = rect.zw * 0.5;
    vec2 p = px - (rect.xy + halfSize);
    float r = min(radius, min(halfSize.x, halfSize.y));
    float d = sdRoundRect(p, halfSize, r); // negativo dentro do botão
    if (d > 0.5) discard;

    // direção "pra fora" da borda mais próxima
    vec2 e = vec2(1.0, 0.0);
    vec2 n = vec2(
      sdRoundRect(p + e.xy, halfSize, r) - sdRoundRect(p - e.xy, halfSize, r),
      sdRoundRect(p + e.yx, halfSize, r) - sdRoundRect(p - e.yx, halfSize, r)
    );
    n /= max(length(n), 1e-4);

    // perto da borda o fundo é puxado pra dentro (lente); no meio só ondula
    float band = edge * min(halfSize.x, halfSize.y);
    float t = 1.0 - clamp(-d / band, 0.0, 1.0);
    float amount = bend * band * t * t;
    vec2 ripple = wave * vec2(sin(px.y * 0.05 + time * 1.2), cos(px.x * 0.045 + time));
    vec2 offset = -n * amount + ripple;

    vec3 color = vec3(
      sampleAt(px + offset * (1.0 + chroma)).r,
      sampleAt(px + offset).g,
      sampleAt(px + offset * (1.0 - chroma)).b
    );
    // borda suave (sem serrilhado)
    float alpha = clamp(0.5 - d, 0.0, 1.0) * opacity;
    gl_FragColor = vec4(color, alpha);
  }
`

type Lens = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  texture: THREE.FramebufferTexture | null
  origin: THREE.Vector2
  visible: boolean
}

function createLens(scene: THREE.Scene, geometry: THREE.PlaneGeometry): Lens {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: null },
      rect: { value: new THREE.Vector4() },
      radius: { value: 0 },
      origin: { value: new THREE.Vector2() },
      texSize: { value: new THREE.Vector2(1, 1) },
      bend: { value: BEND },
      edge: { value: EDGE },
      wave: { value: 0 },
      chroma: { value: CHROMA },
      time: { value: 0 },
      opacity: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.visible = false
  scene.add(mesh)
  return { mesh, texture: null, origin: new THREE.Vector2(), visible: false }
}

// lê raio da borda em px (aceita "32px" e "50%")
function borderRadius(style: CSSStyleDeclaration, width: number, height: number) {
  const value = style.borderTopLeftRadius
  const number = parseFloat(value)
  if (Number.isNaN(number)) return 0
  return value.endsWith('%') ? (number / 100) * Math.min(width, height) : number
}

const PLAIN_GLASS_QUERY = '(prefers-reduced-transparency: reduce), (prefers-contrast: more)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

class LensRenderer {
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1)
  private geometry = new THREE.PlaneGeometry(1, 1)
  private lenses: Lens[]
  private frame = 0
  private disabled = window.matchMedia(PLAIN_GLASS_QUERY).matches
  private reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches

  constructor() {
    this.lenses = Array.from({ length: MAX_LENSES }, () => createLens(this.scene, this.geometry))
  }

  // acompanha as preferências de acessibilidade do sistema
  watchPreferences() {
    const plain = window.matchMedia(PLAIN_GLASS_QUERY)
    const motion = window.matchMedia(REDUCED_MOTION_QUERY)
    const update = () => {
      this.disabled = plain.matches
      this.reduceMotion = motion.matches
    }
    plain.addEventListener('change', update)
    motion.addEventListener('change', update)
    return () => {
      plain.removeEventListener('change', update)
      motion.removeEventListener('change', update)
    }
  }

  // mede onde estão os botões na tela e posiciona as lentes
  private measure(dpr: number, canvasRect: DOMRect, bufferWidth: number, bufferHeight: number) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(LENS_SELECTOR)).filter(
      (element) => element.hasAttribute('data-liquid-lens') || !element.closest('nav, .glass'),
    )
    this.lenses.forEach((lens, index) => {
      const element = elements[index]
      lens.visible = false
      lens.mesh.visible = false
      if (!element) return

      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      const opacity = parseFloat(style.opacity)
      if (box.width < 2 || box.height < 2 || style.visibility === 'hidden' || opacity < 0.01) return

      // retângulo em pixels do canvas, com origem embaixo (como o WebGL)
      const x = (box.left - canvasRect.left) * dpr
      const y = (canvasRect.bottom - box.bottom) * dpr
      const width = box.width * dpr
      const height = box.height * dpr

      // pedaço da tela que vai ser copiado (dentro dos limites do canvas)
      const x0 = Math.max(0, Math.floor(x))
      const y0 = Math.max(0, Math.floor(y))
      const x1 = Math.min(bufferWidth, Math.ceil(x + width))
      const y1 = Math.min(bufferHeight, Math.ceil(y + height))
      if (x1 - x0 < 2 || y1 - y0 < 2) return

      const texWidth = x1 - x0
      const texHeight = y1 - y0
      if (!lens.texture || lens.texture.image.width !== texWidth || lens.texture.image.height !== texHeight) {
        lens.texture?.dispose()
        lens.texture = new THREE.FramebufferTexture(texWidth, texHeight)
        lens.texture.minFilter = THREE.LinearFilter
        lens.texture.magFilter = THREE.LinearFilter
      }
      lens.origin.set(x0, y0)

      const uniforms = lens.mesh.material.uniforms
      uniforms.map.value = lens.texture
      uniforms.rect.value.set(x, y, width, height)
      uniforms.radius.value = borderRadius(style, box.width, box.height) * dpr
      uniforms.origin.value.set(x0, y0)
      uniforms.texSize.value.set(texWidth, texHeight)
      const isSurface = element.dataset.liquidLens === 'edge'
      uniforms.edge.value = isSurface ? EDGE_SURFACE : EDGE
      uniforms.wave.value = (this.reduceMotion || isSurface ? 0 : WAVE) * dpr
      uniforms.opacity.value = opacity

      lens.mesh.position.set(x + width / 2, y + height / 2, 0)
      lens.mesh.scale.set(width, height, 1)
      lens.visible = true
      lens.mesh.visible = true
    })
  }

  render(gl: THREE.WebGLRenderer, time: number) {
    if (this.disabled) return
    const bufferWidth = gl.domElement.width
    const bufferHeight = gl.domElement.height

    if (this.frame++ % MEASURE_EVERY === 0) {
      const canvasRect = gl.domElement.getBoundingClientRect()
      const dpr = canvasRect.width > 0 ? bufferWidth / canvasRect.width : 1
      this.measure(dpr, canvasRect, bufferWidth, bufferHeight)
    }

    // copia o pedaço da tela atrás de cada botão (já com a cena desenhada)
    let any = false
    gl.setRenderTarget(null)
    for (const lens of this.lenses) {
      if (!lens.visible || !lens.texture) continue
      gl.copyFramebufferToTexture(lens.texture, lens.origin)
      lens.mesh.material.uniforms.time.value = time
      any = true
    }
    if (!any) return

    // e desenha cada pedaço de volta, distorcido, no mesmo lugar
    this.camera.right = bufferWidth
    this.camera.top = bufferHeight
    this.camera.updateProjectionMatrix()
    const autoClear = gl.autoClear
    gl.autoClear = false
    gl.render(this.scene, this.camera)
    gl.autoClear = autoClear
  }

  dispose() {
    this.geometry.dispose()
    for (const lens of this.lenses) {
      lens.mesh.material.dispose()
      lens.texture?.dispose()
    }
  }
}

export function LiquidLens() {
  const lensRenderer = useMemo(() => new LensRenderer(), [])

  useEffect(() => lensRenderer.watchPreferences(), [lensRenderer])
  useEffect(() => () => lensRenderer.dispose(), [lensRenderer])

  // prioridade 2: roda depois do BlurredBackground, com a cena já desenhada na tela
  useFrame(({ gl, clock }) => lensRenderer.render(gl, clock.elapsedTime), 2)

  return null
}
