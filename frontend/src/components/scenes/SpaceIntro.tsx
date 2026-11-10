import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { INTRO_HOLD_MS, spaceFade, type IntroPhase } from '../../lib/intro'

const ZOOM_SECONDS = 6

// câmera bem longe, olhando um pouco acima da Terra (ela aparece logo abaixo da logo)
const START_DIRECTION = new THREE.Vector3(22, 9, 85).normalize()
const START_DISTANCE = 94
const HOLD_END_DISTANCE = 86
// durante a logo a câmera também desliza de lado, bem pouco (dá profundidade com os planetas)
const HOLD_ORBIT = 0.07
const START_LOOK_AT = new THREE.Vector3(0, 9, 0)
const END_DIRECTION = new THREE.Vector3(0, 0, 1)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

// o sol fica no canto esquerdo, atrás da Terra: ela aparece como um crescente iluminado
const SUN_POSITION = new THREE.Vector3(-220, 60, -200)

// curvas no estilo das animações da Apple: começa macio e pousa bem devagar
const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const quaternion = new THREE.Quaternion()
const partial = new THREE.Quaternion()
const direction = new THREE.Vector3()
const lookAt = new THREE.Vector3()

type IntroCameraProps = {
  phase: IntroPhase
  getEndDistance: (size: { width: number; height: number }) => number
  onReady: () => void
  onDone: () => void
}

// controla a câmera durante a intro (os OrbitControls ficam desligados)
export function IntroCamera({ phase, getEndDistance, onReady, onDone }: IntroCameraProps) {
  const size = useThree((state) => state.size)
  const elapsedRef = useRef(0)
  // de onde o zoom começa (pega a posição atual, então funciona mesmo se pular a logo)
  const zoomFromRef = useRef<{ direction: THREE.Vector3; distance: number; lookAt: THREE.Vector3 } | null>(null)
  const currentLookAt = useRef(START_LOOK_AT.clone())
  const finishedRef = useRef(false)
  const readyRef = useRef(false)

  useEffect(() => {
    elapsedRef.current = 0
  }, [phase])

  useFrame(({ camera }, delta) => {
    if (phase === 'done' || finishedRef.current) return
    // primeiro quadro desenhado (texturas carregadas): agora começa a contar o tempo da logo
    if (!readyRef.current) {
      readyRef.current = true
      onReady()
    }
    // limita o delta: se a aba travar no carregamento, a animação não pula
    elapsedRef.current += Math.min(delta, 0.1)

    if (phase === 'hold') {
      const progress = easeOutCubic(Math.min(elapsedRef.current / (INTRO_HOLD_MS / 1000), 1))
      const distance = THREE.MathUtils.lerp(START_DISTANCE, HOLD_END_DISTANCE, progress)
      camera.position
        .copy(START_DIRECTION)
        .applyAxisAngle(Y_AXIS, HOLD_ORBIT * (1 - progress))
        .multiplyScalar(distance)
      currentLookAt.current.copy(START_LOOK_AT)
      camera.lookAt(currentLookAt.current)
      return
    }

    if (!zoomFromRef.current) {
      zoomFromRef.current = {
        direction: camera.position.clone().normalize(),
        distance: camera.position.length(),
        lookAt: currentLookAt.current.clone(),
      }
    }

    const from = zoomFromRef.current
    const endDistance = getEndDistance(size)
    const progress = Math.min(elapsedRef.current / ZOOM_SECONDS, 1)
    const t = easeInOutQuint(progress)

    // distância em escala log: no começo anda muito, perto da Terra desacelera
    const distance = Math.exp(THREE.MathUtils.lerp(Math.log(from.distance), Math.log(endDistance), t))
    quaternion.setFromUnitVectors(from.direction, END_DIRECTION)
    partial.identity().slerp(quaternion, t)
    direction.copy(from.direction).applyQuaternion(partial)
    camera.position.copy(direction).multiplyScalar(distance)

    // o ponto que a câmera olha volta pro centro da Terra
    lookAt.copy(from.lookAt).multiplyScalar(1 - t)
    currentLookAt.current.copy(lookAt)
    camera.lookAt(lookAt)

    if (progress >= 1) {
      finishedRef.current = true
      camera.position.set(0, 0, endDistance)
      camera.lookAt(0, 0, 0)
      onDone()
    }
  })

  return null
}

// gerador pseudo-aleatório com semente: as estrelas ficam sempre no mesmo lugar
const seededRandom = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

// cor de estrela pela temperatura: azuladas, brancas e algumas amareladas
const STAR_TINTS = [
  new THREE.Color('#aecbff'),
  new THREE.Color('#dfe8ff'),
  new THREE.Color('#ffffff'),
  new THREE.Color('#fff1dc'),
  new THREE.Color('#ffd7a8'),
]

type StarLayer = { count: number; size: number; opacity: number; seed: number; band?: boolean }

// camadas: muitas estrelas fracas, poucas brilhantes, e a faixa da Via Láctea
const STAR_LAYERS: StarLayer[] = [
  { count: 5000, size: 1, opacity: 0.5, seed: 91357 },
  { count: 1100, size: 1.6, opacity: 0.8, seed: 41221 },
  { count: 140, size: 2.6, opacity: 1, seed: 7741 },
  { count: 9000, size: 1, opacity: 0.2, seed: 55001, band: true },
]

// inclinação da Via Láctea no céu
const BAND_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.9, 0.3, 0.5))

function buildStars({ count, seed, band }: StarLayer) {
  const random = seededRandom(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const point = new THREE.Vector3()
  const color = new THREE.Color()

  for (let index = 0; index < count; index += 1) {
    const theta = random() * Math.PI * 2
    let phi = Math.acos(2 * random() - 1)
    if (band) {
      // concentra perto do "equador" (distribuição quase gaussiana)
      const spread = (random() + random() + random() - 1.5) * 0.22
      phi = Math.PI / 2 + spread
    }
    const radius = 420 + random() * 380
    point.setFromSphericalCoords(radius, phi, theta)
    if (band) point.applyQuaternion(BAND_ROTATION)
    point.toArray(positions, index * 3)

    color.copy(STAR_TINTS[Math.floor(random() * STAR_TINTS.length)])
    color.multiplyScalar(0.55 + random() * 0.45)
    color.toArray(colors, index * 3)
  }

  return { positions, colors }
}

function StarPoints({ layer }: { layer: StarLayer }) {
  const { positions, colors } = useMemo(() => buildStars(layer), [layer])

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={layer.size}
        opacity={layer.opacity}
        sizeAttenuation={false}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

// estrelas bem distantes (fundo do céu, da intro e do globo); ficam fora do desfoque
export function DeepSky() {
  return (
    <>
      {STAR_LAYERS.map((layer) => (
        <StarPoints key={layer.seed} layer={layer} />
      ))}
    </>
  )
}

// sol: disco branco quente com halo (camadas de brilho somadas)
const SUN_GLOWS = [
  { scale: 34, opacity: 1, color: '#fffcf5' },
  { scale: 95, opacity: 0.45, color: '#fff0dc' },
  { scale: 260, opacity: 0.14, color: '#ffe6c4' },
]

function Sun() {
  const glowMap = useTexture('/space/flare-glow.png')

  return (
    <group position={SUN_POSITION}>
      <mesh>
        <sphereGeometry args={[4.2, 48, 48]} />
        <meshBasicMaterial color="#fffdf6" toneMapped={false} />
      </mesh>
      {SUN_GLOWS.map((glow) => (
        <sprite key={glow.scale} scale={[glow.scale, glow.scale, 1]}>
          <spriteMaterial
            map={glowMap}
            color={glow.color}
            opacity={glow.opacity}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  )
}

type PlanetProps = {
  texture: string
  position: [number, number, number]
  radius: number
  tilt?: number
  spin?: number
  children?: React.ReactNode
}

// texturas de cor precisam do espaço de cor sRGB
const prepareColorTexture = (loaded: THREE.Texture | THREE.Texture[]) => {
  for (const texture of Array.isArray(loaded) ? loaded : [loaded]) {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
  }
}

function Planet({ texture, position, radius, tilt = 0, spin = 0.02, children }: PlanetProps) {
  const map = useTexture(texture, prepareColorTexture)
  const meshRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(null)

  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.y += delta * spin
    // perto do globo os planetas escurecem um pouco: a Terra é o destaque
    mesh.material.color.setScalar(THREE.MathUtils.lerp(0.5, 1, spaceFade(camera.position.length())))
  })

  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
      {children}
    </group>
  )
}

function SaturnRings({ inner, outer }: { inner: number; outer: number }) {
  const map = useTexture('/space/saturn-ring-color.jpg', prepareColorTexture)
  // transparência das faixas vem de uma textura separada (tons de cinza)
  const alphaMap = useTexture('/space/saturn-ring-pattern.gif')

  // a textura é uma faixa (de dentro pra fora): remapeia o UV do anel pela distância ao centro
  const geometry = useMemo(() => {
    const ring = new THREE.RingGeometry(inner, outer, 160, 1)
    const position = ring.attributes.position
    const uv = ring.attributes.uv
    const vertex = new THREE.Vector3()
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index)
      uv.setXY(index, (vertex.length() - inner) / (outer - inner), 0.5)
    }
    return ring
  }, [inner, outer])

  useEffect(() => () => geometry.dispose(), [geometry])

  // inclinado pra câmera ver os anéis abertos, não de perfil
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2 + 0.45, 0, 0]}>
      <meshStandardMaterial
        map={map}
        alphaMap={alphaMap}
        side={THREE.DoubleSide}
        transparent
        roughness={1}
        depthWrite={false}
      />
    </mesh>
  )
}

const nightVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

// luzes das cidades só no lado da noite
const nightFragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 sunPosition;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 sunDirection = normalize(sunPosition - vWorldPosition);
    float night = smoothstep(0.12, -0.22, dot(normalize(vNormal), sunDirection));
    vec3 lights = texture2D(map, vUv).rgb * vec3(1.0, 0.82, 0.56) * 1.6;
    gl_FragColor = vec4(lights * night * opacity, 1.0);
  }
`

// brilho da atmosfera na borda, mais forte do lado do sol
const atmosphereFragment = /* glsl */ `
  uniform vec3 sunPosition;
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 sunDirection = normalize(sunPosition - vWorldPosition);
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);
    float lit = smoothstep(-0.35, 0.6, dot(normal, sunDirection));
    vec3 color = mix(vec3(0.28, 0.55, 1.0), vec3(0.75, 0.88, 1.0), rim);
    gl_FragColor = vec4(color * rim * lit * 1.6 * opacity, 1.0);
  }
`

// camadas extras da Terra só na intro: luzes das cidades e atmosfera iluminada pelo sol
export function EarthIntroLayers({ radius }: { radius: number }) {
  const lightsMap = useTexture('/space/earth-lights.png')

  const nightMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: lightsMap },
          sunPosition: { value: SUN_POSITION },
          opacity: { value: 1 },
        },
        vertexShader: nightVertex,
        fragmentShader: nightFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [lightsMap],
  )

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { sunPosition: { value: SUN_POSITION }, opacity: { value: 1 } },
        vertexShader: nightVertex,
        fragmentShader: atmosphereFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useEffect(
    () => () => {
      nightMaterial.dispose()
      atmosphereMaterial.dispose()
    },
    [nightMaterial, atmosphereMaterial],
  )

  const nightRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null)
  const atmosphereRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null)

  useFrame(({ camera }) => {
    const fade = spaceFade(camera.position.length())
    for (const mesh of [nightRef.current, atmosphereRef.current]) {
      if (mesh) mesh.material.uniforms.opacity.value = fade
    }
  })

  return (
    <>
      <mesh ref={nightRef} material={nightMaterial}>
        <sphereGeometry args={[radius * 1.001, 96, 96]} />
      </mesh>
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[radius * 1.035, 96, 96]} />
      </mesh>
    </>
  )
}

// luz do sol; perto do globo a luz principal é a da câmera e o sol vira só um contraluz
export function SunLight() {
  const sunLightRef = useRef<THREE.PointLight>(null)

  useFrame(({ camera }) => {
    if (sunLightRef.current) {
      sunLightRef.current.intensity = THREE.MathUtils.lerp(1.4, 4.6, spaceFade(camera.position.length()))
    }
  })

  return <pointLight ref={sunLightRef} position={SUN_POSITION} intensity={4.6} decay={0} />
}

// sol, planetas e estrelas ficam sempre na cena: a intro só mostra de longe,
// e na visão normal eles continuam lá atrás da Terra
export function SolarSystem() {
  return (
    <>
      <SunLight />
      <Sun />
      <Planet texture="/space/moon.jpg" position={[-15, 4, -23]} radius={0.5} spin={0.01} />
      <Planet texture="/space/mercury.jpg" position={[-150, 38, -190]} radius={0.6} />
      <Planet texture="/space/venus.jpg" position={[-48, 19, -120]} radius={1.2} />
      <Planet texture="/space/mars.jpg" position={[31, -9, 26]} radius={0.7} tilt={0.44} />
      <Planet texture="/space/jupiter.jpg" position={[74, 14, -192]} radius={5.4} tilt={0.05} spin={0.06} />
      <Planet texture="/space/saturn.jpg" position={[-72, -29, -160]} radius={3.9} tilt={0.47} spin={0.05}>
        <SaturnRings inner={4.9} outer={9.2} />
      </Planet>
    </>
  )
}

// estrelas que passam pela câmera no zoom: poucas, finas e suaves (rastro curto, sem "hiperespaço")
const WARP_COUNT = 140
const WARP_DEPTH = 80
const WARP_MIN_RADIUS = 3
const WARP_MAX_RADIUS = 18
const WARP_SPEED = 38
const WARP_STREAK = 5

const warpVertex = /* glsl */ `
  attribute vec4 star; // x, y, z (espaço da câmera), brilho
  uniform float streak;
  uniform float width;
  varying vec2 vQuad;
  varying float vAlpha;
  void main() {
    // faixa fina alinhada com a direção do movimento; largura perpendicular ao raio da tela
    vec2 across = normalize(vec2(-star.y, star.x));
    float along = position.y; // 0 = cabeça (mais perto), 1 = cauda
    vec3 local = vec3(star.xy + across * position.x * width, star.z - along * streak);
    vQuad = position.xy;
    // aparece suave ao longe e some antes de chegar na câmera
    float depth = -star.z;
    vAlpha = star.w * smoothstep(80.0, 50.0, depth) * smoothstep(1.0, 8.0, depth);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(local, 1.0);
  }
`

const warpFragment = /* glsl */ `
  uniform float intensity;
  varying vec2 vQuad;
  varying float vAlpha;
  void main() {
    float core = pow(1.0 - abs(vQuad.x), 2.0);
    float taper = pow(1.0 - vQuad.y, 1.6);
    float alpha = core * taper * vAlpha * intensity;
    gl_FragColor = vec4(vec3(0.86, 0.92, 1.0) * alpha, 1.0);
  }
`

type WarpStar = { x: number; y: number; z: number; brightness: number }

// faz as contas das estrelas do zoom fora do componente (o React não deixa mexer em valores de hook)
class WarpField {
  readonly geometry = new THREE.InstancedBufferGeometry()
  readonly material = new THREE.ShaderMaterial({
    uniforms: { streak: { value: 0 }, width: { value: 0.045 }, intensity: { value: 0 } },
    vertexShader: warpVertex,
    fragmentShader: warpFragment,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  private stars: WarpStar[]
  private data = new Float32Array(WARP_COUNT * 4)
  private attribute = new THREE.InstancedBufferAttribute(this.data, 4)
  private previousDistance: number | null = null
  private intensity = 0

  constructor() {
    const random = seededRandom(24601)
    this.stars = Array.from({ length: WARP_COUNT }, () => {
      const angle = random() * Math.PI * 2
      const radius = WARP_MIN_RADIUS + Math.sqrt(random()) * (WARP_MAX_RADIUS - WARP_MIN_RADIUS)
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: -random() * WARP_DEPTH,
        brightness: 0.25 + random() * 0.55,
      }
    })
    // quadrado de -1..1 (largura) por 0..1 (comprimento)
    const quad = new THREE.PlaneGeometry(2, 1)
    quad.translate(0, 0.5, 0)
    this.geometry.index = quad.index
    this.geometry.setAttribute('position', quad.attributes.position)
    this.geometry.setAttribute('star', this.attribute)
    this.geometry.instanceCount = WARP_COUNT
  }

  update(camera: THREE.Camera, delta: number) {
    // velocidade do zoom em escala log (quanto a distância encolhe por segundo, proporcionalmente)
    const distance = camera.position.length()
    const step = Math.max(delta, 1 / 240)
    const speed = this.previousDistance === null ? 0 : Math.max(0, Math.log(this.previousDistance / distance) / step)
    this.previousDistance = distance
    this.intensity = THREE.MathUtils.damp(this.intensity, THREE.MathUtils.clamp(speed / 1.1, 0, 1), 4, delta)

    const strength = this.intensity
    this.stars.forEach((star, index) => {
      star.z += WARP_SPEED * strength * delta
      if (star.z > -1) star.z -= WARP_DEPTH
      const offset = index * 4
      this.data[offset] = star.x
      this.data[offset + 1] = star.y
      this.data[offset + 2] = star.z
      this.data[offset + 3] = star.brightness
    })
    this.attribute.needsUpdate = true
    this.material.uniforms.streak.value = 0.3 + WARP_STREAK * strength
    this.material.uniforms.intensity.value = strength
    return strength
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}

// estrelas passando pela tela durante o zoom (sensação de velocidade)
// ficam no espaço da câmera, num tubo à frente dela, sem passar pelo centro (onde está a Terra)
// já ficam montadas desde o começo (escondidas) pra não compilar shader na hora do zoom
export function WarpStars({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const field = useMemo(() => new WarpField(), [])

  useEffect(() => () => field.dispose(), [field])

  useFrame(({ camera }, delta) => {
    const group = groupRef.current
    // parada: continua "visível" com brilho zero, assim o shader entra no pré-compilado
    if (!group || !active) return
    group.position.copy(camera.position)
    group.quaternion.copy(camera.quaternion)
    const strength = field.update(camera, delta)
    if (meshRef.current) meshRef.current.visible = strength > 0.01
  })

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={field.geometry} material={field.material} frustumCulled={false} />
    </group>
  )
}

// começa a baixar as texturas assim que o código carrega, todas em paralelo
// (o navegador guarda no cache e a cena não espera uma por uma)
useTexture.preload([
  '/space/flare-glow.png',
  '/space/moon.jpg',
  '/space/mercury.jpg',
  '/space/venus.jpg',
  '/space/mars.jpg',
  '/space/jupiter.jpg',
  '/space/saturn.jpg',
  '/space/saturn-ring-color.jpg',
  '/space/saturn-ring-pattern.gif',
  '/space/earth-lights.png',
  '/earth-day.jpg',
  '/earth-normal.jpg',
  '/earth-clouds.png',
])
