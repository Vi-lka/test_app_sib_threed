import React, { createRef, RefObject, useEffect, useRef, useState } from 'react'
import * as THREE from "three";
import { Html, Image as DreiImage, Instance, Instances, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber';

export type AnnotationsMapProps = {
  range: number, 
  annotationIcon: string,
  deleteIcon: string,
  annotationsData: Array<{position?: THREE.Vector3, title?: string, info?: string}>,
  scale: number,
  sceneSize: THREE.Vector3,
  textHoverEnter?: any,
  textHoverLeave?: any,
  opacity?: number,
  textHoveredState?: any,
  annotationMode?: boolean, 
  handleSelectAnnotation?: any,
  selectedAnnotation?: number,
  handleImgAnnotationHoverEnter?: any,
  handleImgAnnotationHoverLeave?: any,
};


export default function AnnotationsMap(props: AnnotationsMapProps) {
  const stateThree = useThree()

  const [controlsChange, setControlsChange] = useState(false)

  const [annotations, setAnnotations] = useState(props.annotationsData)

  const textPos = ((props.sceneSize.x + props.sceneSize.y + props.sceneSize.z) / 3) / 20

  const annotationsIconsRefs = annotations.map(() => createRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>());
  const annotationsTextRefs = annotations.map(() => createRef<HTMLDivElement>());

  function handleOnStartControls() {
    setControlsChange(true)
  }

  function handleOnEndControls() {
    setControlsChange(false)
  }

  function handleAnnotationsTextClassList(element: any, index: number, array: Array<any>) {

    // Open Last Annotation
    if ((!controlsChange) && (props.range > 0) && (index === (props.range - 1)) && (index === props.selectedAnnotation)) {
      element.current?.classList.add('visible') 
    } else {
      element.current?.classList.remove('visible') 
    }

    // Open Selected Annotation
    if ((!controlsChange) && (props.range > 0) && (index === props.selectedAnnotation)) {
      element.current?.classList.add('visible') 
    } else {
      element.current?.classList.remove('visible') 
    }

    // Close All Annotation if not annotationMode
    if (!props.annotationMode) {
      element.current?.classList.remove('visible')
    }

  }

  stateThree.controls?.addEventListener('start', handleOnStartControls)
  // stateThree.controls?.addEventListener('end', handleOnEndControls)

  useFrame((state) => {

    annotationsIconsRefs.forEach((element: any) => element.current?.lookAt(state.camera.position))

    annotationsTextRefs.forEach(handleAnnotationsTextClassList)

  })
  
  return (
    <>
        {annotations.map((data: any, i: number) => (
            <DreiImage
              visible={props.annotationMode}
              key={i} 
              ref={annotationsIconsRefs[i]}
              url={props.annotationIcon}
              position={data.position}
              scale={props.scale}
              transparent
              opacity={props.opacity}
              onPointerOver={(e: any) => {
                e.stopPropagation()
                if  (props.annotationMode) {
                  annotationsIconsRefs[i].current!.scale.set(props.scale*1.3, props.scale*1.3, 1)
                  props.handleImgAnnotationHoverEnter(i)
                }
              }}
              onPointerOut={(e: any) => {
                e.stopPropagation()
                if (props.annotationMode) {
                  annotationsIconsRefs[i].current!.scale.set(props.scale, props.scale, 1)
                  props.handleImgAnnotationHoverLeave(i)
                }
              }}
              onClick={(e: any) => {
                e.stopPropagation()
                if (props.annotationMode) {
                  props.handleSelectAnnotation(i)
                  handleOnEndControls()
                }
              }}
            />
        ))}
        {annotations.map((data: any, i: number) => (
            <Html
              visible={props.annotationMode}
              key={i}
              // ref={annotationsTextRefs[i]} 
              position={[data.position.x, (data.position.y-textPos), data.position.z ]}
              as='div' 
              wrapperClass=''
              
            >
                <div 
                  ref={annotationsTextRefs[i]} 
                  className='bg-slate-900/80 text-white p-1.5 rounded-md min-h-[30px] min-w-[190px] max-h-[240px] max-w-[200px] w-max overflow-hidden annotation overflow-y-scroll' 
                  onPointerOver={props.textHoverEnter}
                  onPointerOut={props.textHoverLeave}
                >
                  <div className='bottom-0'>
                    <p className="text-sm mb-1.5">
                      <b>{data.title}</b>
                    </p>
                    <p className='text-[10px]'>{data.info}</p>
                  </div>
                </div>
            </Html>
        ))}

    </>
  )
}
