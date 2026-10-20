import * as THREE from 'three'

//converte latitude e longitude em pontos na terra

export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = THREE.MathUtils.degToRad(lng + 180)
    const theta = THREE.MathUtils.degToRad(90 - lat)

    return new THREE.Vector3(
       -radius * Math.cos(phi) * Math.sin(theta),
       radius * Math.cos(theta),
       radius * Math.sin(phi) * Math.sin(theta),
    )
}