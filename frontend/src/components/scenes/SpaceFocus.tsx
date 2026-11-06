import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { KawaseBlurPass, KernelSize } from 'postprocessing'
import { useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'

const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// mistura o fundo nítido com o desfocado e aplica o tone mapping / sRGB da tela
const quadFragment = /* glsl */ `
  uniform sampler2D sharpMap;
  uniform sampler2D blurMap;
  uniform float amount;
  uniform float soften;
  varying vec2 vUv;
  void main() {
    vec4 color = mix(texture2D(sharpMap, vUv), texture2D(blurMap, vUv), amount);
    // perto do globo o fundo perde contraste: menos saturação e brilhos comprimidos
    float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    color.rgb = mix(color.rgb, vec3(luma), 0.4 * soften);
    color.rgb /= 1.0 + color.rgb * 1.8 * soften;
    gl_FragColor = color;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// raio máximo do desfoque (leve: os planetas continuam reconhecíveis)
const MAX_BLUR_SCALE = 0.5

// quanto desfocar pela distância da câmera: de longe nítido, no globo desfocado
const blurAmount = (cameraDistance: number) => 1 - THREE.MathUtils.smoothstep(cameraDistance, 6.5, 16)

// passes do fundo: cena do fundo -> alvo nítido -> blur -> quadro na tela -> cena principal por cima
// com o fundo todo desfocado e a câmera parada, o quadro desfocado fica guardado (cache):
// só a Terra é redesenhada, o fundo é reaproveitado até a câmera mexer
class BackgroundPipeline {
  readonly scene = new THREE.Scene()
  // nítido em resolução cheia (quando aparece sem desfoque) e em meia resolução (só vira entrada do blur)
  private sharp = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  private sharpSmall = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })
  private blurred = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })
  private blurPass = new KawaseBlurPass({ kernelSize: KernelSize.LARGE, resolutionScale: 0.5 })
  private quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quadScene = new THREE.Scene()
  private material = new THREE.ShaderMaterial({
    uniforms: {
      sharpMap: { value: this.sharp.texture },
      blurMap: { value: this.blurred.texture },
      amount: { value: 0 },
      soften: { value: 0 },
    },
    vertexShader: quadVertex,
    fragmentShader: quadFragment,
    depthTest: false,
    depthWrite: false,
  })
  private warmedUp = false
  private cacheValid = false
  private cachedView = new THREE.Matrix4()
  private cachedProjection = new THREE.Matrix4()

  constructor() {
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material))
  }

  setSize(width: number, height: number) {
    this.sharp.setSize(width, height)
    this.sharpSmall.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)))
    this.blurred.setSize(width, height)
    this.blurPass.setSize(width, height)
    this.cacheValid = false
  }

  // compila todos os shaders (fundo, Terra, estrelas do zoom, blur) logo no primeiro quadro;
  // sem isso cada um compila na primeira vez que aparece e a animação engasga no meio
  private warmUp(gl: THREE.WebGLRenderer, mainScene: THREE.Scene, camera: THREE.Camera) {
    this.warmedUp = true
    gl.compile(this.scene, camera)
    gl.compile(mainScene, camera)
    gl.compile(this.quadScene, this.quadCamera)
    this.blurPass.render(gl, this.sharpSmall, this.blurred)
  }

  // fundo já desfocado por completo e câmera no mesmo lugar: dá pra reaproveitar o quadro
  private canReuse(camera: THREE.Camera, amount: number) {
    return (
      this.cacheValid &&
      amount > 0.999 &&
      this.cachedView.equals(camera.matrixWorldInverse) &&
      this.cachedProjection.equals(camera.projectionMatrix)
    )
  }

  render(gl: THREE.WebGLRenderer, mainScene: THREE.Scene, camera: THREE.Camera) {
    if (!this.warmedUp) this.warmUp(gl, mainScene, camera)
    const amount = blurAmount(camera.position.length())
    // a imagem nítida só aparece até 20% do desfoque; depois disso o blur cobre tudo
    const mix = THREE.MathUtils.smoothstep(amount, 0, 0.2)

    if (!this.canReuse(camera, amount)) {
      // com o desfoque cobrindo tudo, o fundo pode ser desenhado em meia resolução (bem mais leve)
      const source = mix >= 1 ? this.sharpSmall : this.sharp
      gl.setRenderTarget(source)
      gl.clear()
      gl.render(this.scene, camera)
      // o raio do blur cresce junto com a aproximação (foco progressivo, sem misturar duas imagens)
      if (amount > 0.001) {
        this.blurPass.blurMaterial.scale = amount * MAX_BLUR_SCALE
        this.blurPass.render(gl, source, this.blurred)
      }
      this.cachedView.copy(camera.matrixWorldInverse)
      this.cachedProjection.copy(camera.projectionMatrix)
      this.cacheValid = true
    }
    this.material.uniforms.amount.value = mix
    this.material.uniforms.soften.value = amount

    gl.setRenderTarget(null)
    gl.autoClear = false
    gl.clear()
    gl.render(this.quadScene, this.quadCamera)
    gl.clearDepth()
    gl.render(mainScene, camera)
    gl.autoClear = true
  }

  dispose() {
    this.sharp.dispose()
    this.sharpSmall.dispose()
    this.blurred.dispose()
    this.blurPass.dispose()
    this.material.dispose()
  }
}

type Props = { children: ReactNode }

// o fundo (planetas e sol) é desenhado numa cena separada e desfocado como uma lente
// com foco na Terra; a Terra e o resto da cena vêm por cima, sempre nítidos
export function BlurredBackground({ children }: Props) {
  const size = useThree((state) => state.size)
  const viewportDpr = useThree((state) => state.viewport.dpr)
  const pipeline = useMemo(() => new BackgroundPipeline(), [])

  useEffect(() => {
    pipeline.setSize(Math.round(size.width * viewportDpr), Math.round(size.height * viewportDpr))
  }, [size, viewportDpr, pipeline])

  useEffect(() => () => pipeline.dispose(), [pipeline])

  // prioridade 1: a partir daqui quem desenha a tela é este componente
  useFrame(({ gl, scene, camera }) => pipeline.render(gl, scene, camera), 1)

  return <>{createPortal(children, pipeline.scene)}</>
}
