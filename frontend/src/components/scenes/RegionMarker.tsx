import {  Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Region } from '../../data/regions'

import { latLngToVector3 } from '../../lib/geo'
import { DataCenterIcon } from './DataCenterIcon'
import styles from './RegionMarker.module.css'


//usa icone do quadro anterior pra nao ter que ficar recriando a cada segundo

const worldPosition = new THREE.Vector3()
const toCamera = new THREE.Vector3()

type Props = {
    region: Region
    radius: number
    isSelected: boolean
    onSelect: (code: string) => void
}

export function RegionMarker({ region, radius, isSelected, onSelect }: Props) {
    const anchorRef = useRef<THREE.Group>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

//pra nao ficar grudado no globo

const position = useMemo(
    () => latLngToVector3 (region.latitude, region.longitude, radius * 1.01),
    [region.latitude, region.longitude, radius]
)

//checa se a cada quadro ele ta ora frente ou atras do quadro

useFrame(({ camera }) => {
    const anchor = anchorRef.current
    const button = buttonRef.current
    if (!anchor || !button) return

    anchor.getWorldPosition(worldPosition)
    
    toCamera.copy(camera.position).sub(worldPosition).normalize()

    //1 = frente, 0 = borda e negativo = atras

    const facing = worldPosition.normalize().dot(toCamera)
    const visibility = THREE.MathUtils.clamp((facing - 0.1) / 0.3, 0,1)
    const isVisible = visibility > 0.05

    button.style.opacity = String(visibility)
    button.style.setProperty('--marker-scale', String(0.55 + 0.45 * visibility))
    button.style.pointerEvents = isVisible ? 'auto' : 'none'
    button.tabIndex = isVisible ? 0 : -1
    button.dataset.visible = String(isVisible)
})
    
return (
    <group ref={anchorRef} position={position}>
      <Html center zIndexRange={[10, 0]}>
        <button
          ref={buttonRef}
          type="button"
          className={`liquid ${styles.marker} ${isSelected ? styles.selected : ''}`}
          data-region={region.code}
          aria-label={`Ver detalhes de ${region.city}`}
          aria-pressed={isSelected}
          onClick={() => onSelect(region.code)}
        >
          <span className="liquid__ring" aria-hidden="true" />
          <DataCenterIcon />
        </button>
      </Html>
    </group>
  )
}