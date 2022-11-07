import React, { createRef, RefObject, useEffect, useRef, useState } from 'react'
import * as THREE from "three";
import { Image as DreiImage, Instance, Instances } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber';

export type AnnotationsMapProps = {
  range: number, 
  url: string,
  positions: Array<THREE.Vector3>,
  scale: number,
  opacity?: number,
};


export default function AnnotationsMap(props: AnnotationsMapProps) {
  const stateThree = useThree()

  const vec = new THREE.Vector3

  const refDreiImage = createRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>()

  const [hovered, setHovered] = useState(false)

  const anotationData = Array.from({ length: props.range }, () => ({ 
    positions: props.positions,
    url: props.url, 
    scale: props.scale, 
    opacity: props.opacity
  }))

  const annotationsRefs = anotationData.map(() => createRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>());

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  useFrame((state) => {
    anotationData.map((data, i) => annotationsRefs[i].current!.lookAt(state.camera.position))
  })

//   function hoveredFunc(i: React.RefObject<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>, scale:number, hov: boolean) {
//     i.current!.scale.lerp(vec.set(hov ? scale*1.5 : scale, hov ? scale*1.5 : scale, 1), 0.15)
//     console.log(hov)
//   }
  
  return (
    <>
        {anotationData.map((data, i) => (
            <DreiImage
                key={i} 
                ref={annotationsRefs[i]}
                url={data.url}
                position={data.positions[i]}
                scale={data.scale}
                transparent
                opacity={data.opacity}
                onPointerOver={(e: any) => {
                  e.stopPropagation()
                  setHovered(true)
                  annotationsRefs[i].current!.scale.set(data.scale*1.3, data.scale*1.3, 1)
                }}
                onPointerOut={(e: any) => {
                  e.stopPropagation()
                  setHovered(false)
                  annotationsRefs[i].current!.scale.set(data.scale, data.scale, 1)
                }}
            />
        ))}

    </>
  )
}
