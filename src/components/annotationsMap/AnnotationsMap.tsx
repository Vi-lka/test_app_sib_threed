import React, { createRef, RefObject, useEffect, useRef, useState } from 'react'
import * as THREE from "three";
import { Html, Image as DreiImage, Instance, Instances } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber';
import { HtmlProps } from '@react-three/drei/web/Html';

export type AnnotationsMapProps = {
  range: number, 
  url: string,
  positions: Array<THREE.Vector3>,
  scale: number,
  sceneSize: THREE.Vector3,
  opacity?: number,
};


export default function AnnotationsMap(props: AnnotationsMapProps) {
  const stateThree = useThree()

  const [hovered, setHovered] = useState(false)

  const anotationData = Array.from({ length: props.range }, () => ({ 
    positions: props.positions,
    url: props.url, 
    scale: props.scale, 
    opacity: props.opacity
  }))

  const textPos = ((props.sceneSize.x + props.sceneSize.y + props.sceneSize.z) / 3) / 9
  console.log(props.sceneSize)

  const annotationsIconsRefs = anotationData.map(() => createRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>());

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  useFrame((state) => {
    anotationData.map((data, i) => annotationsIconsRefs[i].current!.lookAt(state.camera.position))
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
                ref={annotationsIconsRefs[i]}
                url={data.url}
                position={data.positions[i]}
                scale={data.scale}
                transparent
                opacity={data.opacity}
                onPointerOver={(e: any) => {
                    console.log(data.positions[i])
                  e.stopPropagation()
                  setHovered(true)
                  annotationsIconsRefs[i].current!.scale.set(data.scale*1.3, data.scale*1.3, 1)
                }}
                onPointerOut={(e: any) => {
                  e.stopPropagation()
                  setHovered(false)
                  annotationsIconsRefs[i].current!.scale.set(data.scale, data.scale, 1)
                }}
            />
        ))}
        {anotationData.map((data, i) => (
            <Html
                key={i} 
                position={[data.positions[i].x, (data.positions[i].y < 0 ? data.positions[i].y - textPos : data.positions[i].y + textPos), data.positions[i].z]}
                as='div' // Wrapping element (default: 'div')
                wrapperClass=''
                distanceFactor={2} // If set (default: undefined), children will be scaled by this factor, and also by distance to a PerspectiveCamera / zoom by a OrthographicCamera.
                center
                // transform
                // sprite 
                onOcclude={(visible: any) => null} // Callback when the visibility changes (default: undefined)
            >
                <div className='bg-slate-900/80 text-white p-1.5 rounded-md'>
                    <h1>hello</h1>
                    <p>world</p>
                </div>
            </Html>
        ))}

    </>
  )
}
