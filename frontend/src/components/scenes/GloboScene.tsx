import { OrbitControls, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
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

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [surfaceMap, normalMap, cloudsMap] = useTexture([
    '/earth-day.jpg',
    '/earth-normal.jpg',
    '/earth-clouds.png',
  ])

  surfaceMap.colorSpace = THREE.SRGBColorSpace
  cloudsMap.colorSpace = THREE.SRGBColorSpace

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.025
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.032
  })

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.35, 96, 96]} />
        <meshStandardMaterial
          map={surfaceMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.025, 0.025)}
          roughness={0.92}
          metalness={0}
        />
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

function CameraFit() {
  const { camera, size } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, size.width / size.height < 0.8 ? 7.8 : 5.2)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}

export function GloboScene() {
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
        <directionalLight position={[-4, 2, 5]} intensity={3.8} />
        <Starfield />
        <Earth />
        <OrbitControls
          enablePan={false}
          minDistance={3.4}
          maxDistance={12}
          rotateSpeed={0.45}
        />
      </Canvas>
    </main>
  )
}
