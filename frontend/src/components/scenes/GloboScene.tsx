import { OrbitControls, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type {Region} from '../../data/regions'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { latLngToVector3 } from '../../lib/geo'
import { RegionMarker } from './RegionMarker'
import * as THREE from 'three'


function Starfield() {
  const positions = useMemo(() => {
    const count = 2600
    const vertices = new Float32Array(count * 3)
    let seed = 73421

    const random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    for (let index = 0; index < count; index += 1) {
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      const radius = 12 + random() * 38
      vertices[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
      vertices[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      vertices[index * 3 + 2] = radius * Math.cos(phi)
    }

    return vertices
  }, [])

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#dceaff"
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  )
}


const EARTH_RADIUS = 1.35
// distância mínima entre marcadores na tela (botão de 56px + respiro)
const MARKER_GAP = 64
const projected = new THREE.Vector3()

type ScreenPoint = { code: string; el: HTMLElement; x: number; y: number }

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
}

function Earth({ regions, selectedCode, onSelectRegion, focusRequest }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null)
  const targetRotationRef = useRef<number | null>(null)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const offsetsRef = useRef(new Map<string, { x: number; y: number }>())
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
    if (selectedCode) return
    cameraTargetRef.current = camera.position
      .clone()
      .normalize()
      .multiplyScalar(getDefaultDistance(size))
  }, [selectedCode, camera, size])

  // mesma posição usada pelo RegionMarker
  const markerPositions = useMemo(
    () =>
      regions.map((region) => ({
        code: region.code,
        position: latLngToVector3(region.latitude, region.longitude, EARTH_RADIUS * 1.01),
      })),
    [regions],
  )

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
  const [surfaceMap, normalMap, cloudsMap] = useTexture([
    '/earth-day.jpg',
    '/earth-normal.jpg',
    '/earth-clouds.png',
  ])

  surfaceMap.colorSpace = THREE.SRGBColorSpace
  cloudsMap.colorSpace = THREE.SRGBColorSpace


  // regiões próximas (ex: Ashburn e Toronto) caem uma em cima da outra na tela:
  // agrupa as que se sobrepõem e espalha lado a lado em volta do centro do grupo
  const spreadOverlappingMarkers = (earth: THREE.Object3D, delta: number) => {
    const { width, height } = size
    earth.updateWorldMatrix(true, false)

    const visible: ScreenPoint[] = []
    for (const { code, position } of markerPositions) {
      const el = document.querySelector<HTMLElement>(`[data-region="${code}"]`)
      if (!el) continue

      if (el.dataset.visible === 'true') {
        projected.copy(position).applyMatrix4(earth.matrixWorld).project(camera)
        visible.push({
          code,
          el,
          x: ((projected.x + 1) / 2) * width,
          y: ((1 - projected.y) / 2) * height,
        })
      } else {
        applyOffset(code, el, 0, 0, delta)
      }
    }

    const groups: ScreenPoint[][] = []
    for (const point of visible) {
      const group = groups.find((g) =>
        g.some((other) => Math.hypot(other.x - point.x, other.y - point.y) < MARKER_GAP),
      )
      if (group) group.push(point)
      else groups.push([point])
    }

    for (const group of groups) {
      if (group.length === 1) {
        applyOffset(group[0].code, group[0].el, 0, 0, delta)
        continue
      }

      const centerX = group.reduce((sum, p) => sum + p.x, 0) / group.length
      const centerY = group.reduce((sum, p) => sum + p.y, 0) / group.length

      // ordem da esquerda pra direita; o selecionado vai pro fim (lado do painel),
      // assim a linha até o painel não passa por cima do vizinho
      group
        .sort((a, b) => {
          if (a.code === selectedCode) return 1
          if (b.code === selectedCode) return -1
          return a.x - b.x
        })
        .forEach((point, index) => {
          const slotX = centerX + (index - (group.length - 1) / 2) * MARKER_GAP
          applyOffset(point.code, point.el, slotX - point.x, centerY - point.y, delta)
        })
    }
  }

  // anda suave até o deslocamento alvo (sem "pular" quando os grupos mudam)
  const applyOffset = (code: string, el: HTMLElement, x: number, y: number, delta: number) => {
    const current = offsetsRef.current.get(code) ?? { x: 0, y: 0 }
    current.x = THREE.MathUtils.damp(current.x, x, 10, delta)
    current.y = THREE.MathUtils.damp(current.y, y, 10, delta)
    offsetsRef.current.set(code, current)
    el.style.setProperty('--offset-x', `${current.x.toFixed(1)}px`)
    el.style.setProperty('--offset-y', `${current.y.toFixed(1)}px`)
  }

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

    if (earth) spreadOverlappingMarkers(earth, delta)
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
        {regions.map((region) => (
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
function CameraLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useFrame(({ camera }) => {
    lightRef.current?.position.copy(LIGHT_OFFSET).applyQuaternion(camera.quaternion)
  })

  return <directionalLight ref={lightRef} position={LIGHT_OFFSET} intensity={3.8} />
}

function CameraFit() {
  const { camera, size } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, getDefaultDistance(size))
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}

export function GloboScene({ regions, selectedCode, onSelectRegion, focusRequest }: EarthProps) {
  return (
    <main className="App" aria-label="Terra no espaço">
      <Canvas
        className="space-canvas"
        camera={{ fov: 42, near: 0.1, far: 100, position: [0, 0, 5.2] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        <CameraFit />
        <ambientLight intensity={0.36} />
        <CameraLight />
        <Starfield />
         <Earth
          regions={regions}
          selectedCode={selectedCode}
          onSelectRegion={onSelectRegion}
          focusRequest={focusRequest}
        />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={3.4}
          maxDistance={12}
          rotateSpeed={0.45}
        />
      </Canvas>
    </main>
  )
}
