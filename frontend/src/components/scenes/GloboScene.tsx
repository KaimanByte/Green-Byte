import { OrbitControls, PerformanceMonitor, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import type {Region} from '../../data/regions'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { latLngToVector3 } from '../../lib/geo'
import { RegionMarker } from './RegionMarker'
import { DeepSky, EarthIntroLayers, IntroCamera, SolarSystem, SunLight, WarpStars } from './SpaceIntro'
import { BlurredBackground } from './SpaceFocus'
import { LiquidLens } from './LiquidLens'
import { spaceFade, type IntroPhase } from '../../lib/intro'
import * as THREE from 'three'


const EARTH_RADIUS = 1.35

const EARTH_TEXTURES = ['/earth-day.jpg', '/earth-normal.jpg', '/earth-clouds.png']

/**
 * Cor (superfície e nuvens) em sRGB; o normal map continua linear.
 * Ajustado no callback de carregamento do useTexture, e não no valor retornado
 * pelo hook (react-hooks/immutability). Função de módulo: referência estável,
 * então o drei só a chama quando as texturas carregam.
 */
function setEarthColorSpace(textures: THREE.Texture | THREE.Texture[]) {
  const [surface, , clouds] = Array.isArray(textures) ? textures : [textures]
  for (const texture of [surface, clouds]) {
    if (texture && texture.colorSpace !== THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
  }
}

// distância normal da câmera (mais longe em tela em pé, pro globo caber)
const getDefaultDistance = (size: { width: number; height: number }) =>
  size.width / size.height < 0.8 ? 7.8 : 5.2

// zoom ao selecionar uma região: fração da distância normal
const ZOOM_FACTOR = 0.68
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const cameraDirection = new THREE.Vector3()
const targetDirection = new THREE.Vector3()

// pedido pra girar o globo até uma região (vem da busca); o id muda a cada pedido
export type FocusRequest = { code: string; id: number }

type EarthProps = {
  regions: Region[]
  selectedCode: string | null
  onSelectRegion: (code: string) => void
  focusRequest?: FocusRequest | null
  introPhase?: IntroPhase
}

function Earth({ regions, selectedCode, onSelectRegion, focusRequest, introPhase = 'done' }: EarthProps) {
  const isIntroDone = introPhase === 'done'
  const earthRef = useRef<THREE.Mesh>(null)
  const targetRotationRef = useRef<number | null>(null)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  // pra onde a câmera está indo (zoom na região / volta ao normal); null = parada
  const cameraTargetRef = useRef<THREE.Vector3 | null>(null)
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null

  // se a pessoa arrastar ou der scroll, para a animação e deixa ela no controle
  useEffect(() => {
    if (!controls) return
    const cancel = () => {
      cameraTargetRef.current = null
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controls])

  // fechou o painel: afasta de volta pra distância normal, mantendo o ângulo
  useEffect(() => {
    // durante a intro quem mexe na câmera é o IntroCamera
    if (selectedCode || !isIntroDone) return
    cameraTargetRef.current = camera.position
      .clone()
      .normalize()
      .multiplyScalar(getDefaultDistance(size))
  }, [selectedCode, camera, size, isIntroDone])


  // calcula quanto girar no eixo y pra região ficar de frente pra câmera
  useEffect(() => {
    const earth = earthRef.current
    const region = regions.find((r) => r.code === focusRequest?.code)
    if (!earth || !region) return

    const point = latLngToVector3(region.latitude, region.longitude, 1)
    const cameraAngle = Math.atan2(camera.position.x, camera.position.z)
    const target = cameraAngle - Math.atan2(point.x, point.z)

    // pega o caminho mais curto (no máximo meia volta)
    const current = earth.rotation.y
    const diff = THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI
    targetRotationRef.current = current + diff

    // onde a região vai parar depois do giro: a câmera vai pra cima dela, mais perto
    cameraTargetRef.current = point
      .applyAxisAngle(Y_AXIS, current + diff)
      .normalize()
      .multiplyScalar(getDefaultDistance(size) * ZOOM_FACTOR)
  }, [focusRequest, regions, camera, size])
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [surfaceMap, normalMap, cloudsMap] = useTexture(EARTH_TEXTURES, setEarthColorSpace)

  //parar qnd selecionar regiao
   useFrame((_, delta) => {
    const earth = earthRef.current
    const target = targetRotationRef.current

    // girando até a região buscada: desacelera suave no final
    if (earth && target !== null) {
      earth.rotation.y = THREE.MathUtils.damp(earth.rotation.y, target, 4, delta)
      if (Math.abs(target - earth.rotation.y) < 0.001) targetRotationRef.current = null
    } else if (earth && !selectedCode) {
      earth.rotation.y += delta * 0.025
    }

    // zoom: anda a direção e a distância da câmera aos poucos (sempre olhando pro centro)
    const cameraTarget = cameraTargetRef.current
    if (cameraTarget) {
      const t = 1 - Math.exp(-3.5 * delta)
      const distance = THREE.MathUtils.lerp(camera.position.length(), cameraTarget.length(), t)
      targetDirection.copy(cameraTarget).normalize()
      cameraDirection.copy(camera.position).normalize().lerp(targetDirection, t).normalize()
      camera.position.copy(cameraDirection).multiplyScalar(distance)
      camera.lookAt(0, 0, 0)
      controls?.update()
      if (camera.position.distanceTo(cameraTarget) < 0.002) cameraTargetRef.current = null
    }

    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.032
  })
  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={surfaceMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.025, 0.025)}
          roughness={0.92}
          metalness={0}
        />
        {!isIntroDone && <EarthIntroLayers radius={EARTH_RADIUS} />}
        {isIntroDone && regions.map((region) => (
          <RegionMarker
            key={region.code}
            region={region}
            radius={EARTH_RADIUS}
            isSelected={region.code === selectedCode}
            onSelect={onSelectRegion}
          />
        ))}
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.362, 72, 72]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.16}  
          roughness={1}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.018}>
        <sphereGeometry args={[1.35, 64, 64]} />
        <meshBasicMaterial
          color="#378de8"
          side={THREE.BackSide}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// posição da luz em relação à câmera (a mesma de antes: em cima, à esquerda, na frente)
const LIGHT_OFFSET = new THREE.Vector3(-4, 2, 5)

// a luz gira junto com a câmera: arrastar o globo não leva o lado escuro pra frente
// na intro quem ilumina é o sol (Terra em crescente); perto do globo volta essa luz
function CameraLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)

  useFrame(({ camera }) => {
    const fade = spaceFade(camera.position.length())
    if (lightRef.current) {
      lightRef.current.position.copy(LIGHT_OFFSET).applyQuaternion(camera.quaternion)
      lightRef.current.intensity = 3.8 * (1 - fade)
    }
    if (ambientRef.current) ambientRef.current.intensity = THREE.MathUtils.lerp(0.36, 0.03, fade)
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.36} />
      <directionalLight ref={lightRef} position={LIGHT_OFFSET} intensity={3.8} />
    </>
  )
}

function CameraFit({ isIntroDone }: { isIntroDone: boolean }) {
  const { camera, size } = useThree()
  const { width, height } = size

  useEffect(() => {
    if (!isIntroDone) return
    camera.position.set(0, 0, getDefaultDistance({ width, height }))
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, width, height, isIntroDone])

  return null
}

type GloboSceneProps = EarthProps & {
  onIntroReady?: () => void
  onIntroDone?: () => void
}

export function GloboScene({
  regions,
  selectedCode,
  onSelectRegion,
  focusRequest,
  introPhase = 'done',
  onIntroReady = () => {},
  onIntroDone = () => {},
}: GloboSceneProps) {
  const isIntroDone = introPhase === 'done'
  // resolução se adapta ao computador: se os quadros caírem, desenha com menos pixels
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, 1.5))

  return (
    <main className="App" aria-label="Terra no espaço">
      <Canvas
        className="space-canvas"
        camera={{ fov: 42, near: 0.1, far: 1500, position: [0, 0, 5.2] }}
        dpr={dpr}
        // em notebook com duas placas, pede a placa de vídeo dedicada
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <PerformanceMonitor
          flipflops={3}
          onChange={({ factor }) => setDpr(Math.min(window.devicePixelRatio, 0.75 + 0.75 * factor))}
          onFallback={() => setDpr(0.75)}
        />
        <CameraFit isIntroDone={isIntroDone} />
        {!isIntroDone && (
          <IntroCamera
            phase={introPhase}
            getEndDistance={getDefaultDistance}
            onReady={onIntroReady}
            onDone={onIntroDone}
          />
        )}
        {/* fundo numa cena à parte, desfocado perto do globo (sem Suspense próprio:
            a cena só aparece com todas as texturas prontas) */}
        <BlurredBackground>
          <color attach="background" args={['#000000']} />
          <CameraLight />
          <SolarSystem />
        </BlurredBackground>
        <SunLight />
        <DeepSky />
        {!isIntroDone && <WarpStars active={introPhase === 'zoom'} />}
        <CameraLight />
         <Earth
          regions={regions}
          selectedCode={selectedCode}
          onSelectRegion={onSelectRegion}
          focusRequest={focusRequest}
          introPhase={introPhase}
        />
        <OrbitControls
          makeDefault
          enabled={isIntroDone}
          enablePan={false}
          minDistance={3.4}
          maxDistance={12}
          rotateSpeed={0.45}
        />
        {/* refração do vidro líquido atrás dos botões (depois da cena desenhada) */}
        <LiquidLens />
        
      </Canvas>
    </main>
  )
}
