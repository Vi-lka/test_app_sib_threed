import React, { createRef, Suspense, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import * as THREE from "three";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Bounds, Center as DreiCenter, Environment, Float, Html, Lightformer, Loader, OrbitControls, Preload, useBounds, useGLTF, useProgress } from '@react-three/drei';
import { Button, Input, Tab, TabList, TabPanel, TabPanels, Tabs, Textarea, useToast } from '@chakra-ui/react';
import { Image as DreiImage } from '@react-three/drei'
import AddTexture from './components/addTexture/addTexture';
import { AddIcon } from '@chakra-ui/icons';
import null_texture from './models/null_texture.png'
import null_texture_normal from './models/null_texture_normal.png'
import annotation_icon from './models/annotation-icon.png'
import delete_icon from './models/delete-icon.png'
import { Color, Depth, LayerMaterial } from 'lamina';
import AnnotationsMap from './components/annotationsMap/AnnotationsMap';
import { Console } from 'console';

function App() {

  // set Loading
  const { active } = useProgress()
  const [loadingState, setloadingState] = useState<boolean>(true)

  // set 3D-Model
  const [model, setModel] = useState<any | null>(null)
  const [modelURL, setModelURL] = useState("")

  // set Maps for 3D-Model
  const [colorMap, setcolorMap] = useState<any | null>(null)
  const [colorMapURL, setcolorMapURL] = useState("")

  const [normalMap, setnormalMap] = useState<any | null>(null)
  const [normalMapURL, setnormalMapURL] = useState("")

  const [metalnessMap, setmetalnessMap] = useState<any | null>(null)
  const [metalnessMapURL, setmetalnessMapURL] = useState("")
  const [metalness, setMetalness] = useState("0")

  const [roughnessMap, setroughnessMap] = useState<any | null>(null)
  const [roughnessMapURL, setroughnessMapURL] = useState("")
  const [roughness, setRoughness] = useState("1")

  const [aoMap, setaoMap] = useState<any | null>(null)
  const [aoMapURL, setaoMapURL] = useState("")

  // set Screenshot 
  const [screenshot, setScreenshot] = useState<any | null>(null)

  // set Annotation Mode 
  const [annotationMode, setAnnotationMode] = useState<boolean>(false)

  // Global Annotations states
  const [counter, setCounter] = useState<number>(0)
  const maxCounter = 10

  const [annotations, setAnnotations] = useState<Array<{position?: THREE.Vector3, title?: string, info?: string}>>([])
  const annotationsSettingsRefs = annotations.map(() => createRef<HTMLDivElement>());

  const [selectedAnnotation, setSelectedAnnotation] = useState<number>((counter - 1))

  const [updateState, setUpdateState] = useState<boolean>(false)

  // Global handles
  const handleDeleteAnnotation = (data: any, i: number) => {
    
    setCounter(counter - 1)

    let filteredAnnotations = annotations.filter(item => item !== annotations[i])
    setAnnotations(filteredAnnotations)

  }

  const handleChangeTitle = (e: any, index: number) => {
    const changedAnnotations = annotations.map((data, i) => {
      if (i === index) {
        return {
          ...data,
          title: e.target.value
        }
      } else {
        return data
      }
    })
    setAnnotations(changedAnnotations)
  }

  const handleChangeInfo = (e: any, index:number) => {
    const changedAnnotations = annotations.map((data, i) => {
      if (i === index) {
        return {
          ...data,
          info: e.target.value
        }
      } else {
        return data
      }
    })
    setAnnotations(changedAnnotations)
  }

  const handleSaveChanges = () => {
    console.log(annotations)
  }

  function Scene() {

    const stateThree = useThree()

    const toast = useToast()
    const idToast = 'id-toast'

    const [textHovered, setTextHovered] = useState(false)

    // Model Settings
    const [colormap, normalmap, metalnessmap, roughnessmap, aomap] = useLoader(
      TextureLoader,
      [
        colorMapURL ? colorMapURL : null_texture,
        normalMapURL ? normalMapURL : null_texture_normal,
        metalnessMapURL ? metalnessMapURL : null_texture,
        roughnessMapURL ? roughnessMapURL : null_texture,
        aoMapURL ? aoMapURL : null_texture,
      ]
    )
  
    colormap!.flipY = false
    normalmap!.flipY = false
    metalnessmap!.flipY = false
    roughnessmap!.flipY = false
    aomap!.flipY = false

    let myMaterial = new THREE.MeshPhysicalMaterial({
      color: "#000",
      map: colormap,
      normalMap: normalmap,
      metalnessMap: metalnessmap,
      metalness: parseFloat(metalness),
      roughnessMap: roughnessmap,
      roughness: parseFloat(roughness),
      aoMap: aomap,
    })

    // const fbx = useLoader(FBXLoader, `${model3d.data!.model}`)
    // fbx.traverse(function (child) {
    //   if ((child as THREE.Mesh).isMesh) {
    //     (child as THREE.Mesh).material = material;
    //     (child as THREE.Mesh).castShadow = true;
    //     (child as THREE.Mesh).receiveShadow = true;
    //   }
    // })

    const gltf = useGLTF(`${modelURL}`)
    gltf.scene.traverse( function (object: any) {
      if (object instanceof THREE.Mesh) {
        colorMapURL && (object.material.map = myMaterial.map);
        normalMapURL && (object.material.normalMap = myMaterial.normalMap);
        metalnessMapURL && (object.material.metalnessMap = myMaterial.metalnessMap);
        metalness && (object.material.metalness = myMaterial.metalness);
        roughnessMapURL && (object.material.roughnessMap = myMaterial.roughnessMap);
        roughness && (object.material.roughness = myMaterial.roughness);
        aoMapURL && (object.material.aoMap = myMaterial.aoMap);
      }
    })

    // ReyCasting settings
    const sceneBox = new THREE.Box3().setFromObject( gltf.scene )
    const sceneSize = sceneBox.getSize(new THREE.Vector3())

    const geometry = new THREE.BufferGeometry()
    geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] )
    const line = new THREE.Line( geometry, new THREE.LineBasicMaterial({color: 0x000000}) )
    // stateThree.scene.add( line )

    const mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() )
    mouseHelper.visible = false
    stateThree.scene.add( mouseHelper )

    const intersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] | undefined = []

    const intersection = {
      intersects: true,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3()
    }

    let p = new THREE.Vector3
    let n = new THREE.Vector3

    let moved = false

    window.addEventListener( 'wheel', function () {
      moved = true
    })

    // Handle Place Annotation
    stateThree.gl.domElement.addEventListener( 'dblclick', function () {
      if ( annotationMode && (moved === false) && (intersection.intersects) && (textHovered === false) ) { 
        handlePlaceAnnotation()
      }
    })

    const handlePlaceAnnotation = () => {

      if (counter < maxCounter) {
        setCounter(counter + 1)
        annotations[counter] = {position: n, title: "", info: ""}
        setSelectedAnnotation(counter)
        setAnnotations(annotations)
      }

    }

    const handleTextHovered = (e: any) => {
      setTextHovered(e)
    }

    const handleSelectAnnotation = (value: number) => {
      setSelectedAnnotation(value)
    }

    const handleImgAnnotationHoverEnter = (i: number) => {
      if (i !== selectedAnnotation) {
        annotationsSettingsRefs[i].current?.classList.add('annotationsSettingsHover')
      }
    }

    const handleImgAnnotationHoverLeave = (i: number) => {
      annotationsSettingsRefs[i].current?.classList.remove('annotationsSettingsHover')
    }

    annotationsSettingsRefs.forEach( 
      function (element: any, index: number, array: Array<any>) {
        if (index === selectedAnnotation) {
          element.current?.classList.add('selected') 
          element.current?.classList.remove('annotationsSettingsHover')
        } else {
          element.current?.classList.remove('selected') 
        }
      }
    )

  useEffect(() => {
    stateThree.gl.domElement.addEventListener( 'dblclick', function () {
      if ( annotationMode && (moved === false) && (intersection.intersects) && (textHovered === false) && (counter === maxCounter) && (!toast.isActive(idToast))) {
        toast({
          id: idToast,
          title: "Внимание!",
          description: `Можно добавлять не более ${maxCounter} аннотаций`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        })
      } 
    })
  }, [counter])

    useFrame((state) => {

      // console.log(`moved: ${moved}`)
      // console.log(`textHovered: ${textHovered}`)

      setloadingState(active)

      if (annotationMode && (moved === false) && (textHovered === false)) {

        state.raycaster.intersectObject( gltf.scene.children[0]!, true, intersects )

        line.geometry.attributes.position!.setXYZ( 0, 0, 0, 0 );
        line.geometry.attributes.position!.setXYZ( 1, 0, 0, 0 );
        line.geometry.attributes.position!.needsUpdate = true;

        if ( intersects.length > 0 ) {
  
          p = intersects[ 0 ]!.point;
          mouseHelper.position.copy( p );
          intersection.point.copy( p );
  
          n = intersects[ 0 ]!.face!.normal.clone();
          n.transformDirection( intersects[ 0 ]!.object.matrixWorld );
          n.multiplyScalar( 0.04*((sceneSize.x + sceneSize.y + sceneSize.z)/3) );
          n.add( intersects[ 0 ]!.point );
  
          intersection.normal.copy( intersects[ 0 ]!.face!.normal );
          mouseHelper.lookAt( n );
  
          line.geometry.attributes.position!.setXYZ( 0, p.x, p.y, p.z );
          line.geometry.attributes.position!.setXYZ( 1, (n.x), (n.y), (n.z) );
          line.geometry.attributes.position!.needsUpdate = true;

          // intersects[ 0 ]!.object.
  
          intersection.intersects = true;
  
          intersects.length = 0;
  
        } else {
            intersection.intersects = false;
        }
      } else {

        if ( intersects.length > 0 ) {
          intersects.length = 0;
          intersection.intersects = false;
        }

      }
    })

    return (
      <>
        <Bounds fit={loadingState} clip={loadingState} observe damping={0} margin={1.2}>
          <DreiCenter>
            <primitive
              object={gltf.scene}
              position={[0, 0, 0]}
              scale={1}
              receiveShadow
              castShadow
            />
          </DreiCenter>
        </Bounds>
        <AnnotationsMap
            range={counter}
            annotationIcon={annotation_icon}
            deleteIcon={delete_icon}
            annotationsData={annotations}
            scale={((sceneSize.x + sceneSize.y + sceneSize.z) / 3) / 15}
            sceneSize={sceneSize}
            textHoverEnter={(e: any) => {
              e.stopPropagation()
              handleTextHovered(true)
            }}
            textHoverLeave={(e: any) => {
              e.stopPropagation()
              handleTextHovered(false)
            }}
            opacity={0.8}
            textHoveredState={textHovered}
            annotationMode={annotationMode}
            handleSelectAnnotation={handleSelectAnnotation}
            selectedAnnotation={selectedAnnotation}
            handleImgAnnotationHoverEnter={handleImgAnnotationHoverEnter}
            handleImgAnnotationHoverLeave={handleImgAnnotationHoverLeave}
          />

        <OrbitControls 
          enabled={!textHovered} 
          enableDamping={false} 
          makeDefault
          onStart={(e: any) => {
            moved = false
          }} 
          onChange={(e: any) => {
            moved = true
          }} 
          onEnd={(e: any) => {
            moved = false
          }}
        />
      </>
    );
  }
  return (
    <div className="App">
      <div className="flex flex-row-reverse items-center justify-center h-screen">

        {!modelURL && (
          <>
            <div className="flex justify-center ml-6 flex-wrap">
              <label className="fileInputLabelmap" htmlFor="fileInputModel">
                <AddIcon 
                  w={8} 
                  h={8}
                  margin="5px"
                  bgColor="teal.400" 
                  padding="5px" 
                  borderRadius="6px" 
                  color="white"
                  _hover={{ bgColor: "teal.600", padding: "8px", borderRadius: "10px" }}
                  transition={"ease-in-out 0.2s"}
                />
                  Загрузить модель
              </label>
              <input
                type="file"
                accept="model/gltf-binary"
                id="fileInputModel"
                style={{ display: "none" }}
                onChange={(e: any) => {
                  setModel(e.target.files![0]);
                  setModelURL(URL.createObjectURL(e.target.files![0]!));
                }}
              />
            </div>
          </>
        )}

          {modelURL ? (
            model.name.includes("glb") ? (
              <>
                <div key="" id="CanvasFrame" className="w-3/4 h-screen bg-gray-200 float-right relative">
                  <Canvas
                    shadows={true}
                    camera={{
                      fov: 45,
                      near: 0.1,
                      far: 1000,
                      position: [0, 0, 10],
                    }}
                    gl={{ preserveDrawingBuffer: true, antialias: true }}
                    dpr={[1, 1.5]}
                    onCreated={({ gl, events, scene, camera, raycaster }) => { 
                    }}
                  >
                    <Suspense
                      fallback={
                        <Html>
                          <Loader
                            dataStyles={{ color: "#000000" }} // Text styles
                            dataInterpolation={(p) => `Loading ${p.toFixed(1)}%`} // Text
                            initialState={(active) => active} // Initial black out state
                          />
                        </Html>
                      }
                    >
                    
                      {/* <ambientLight intensity={1} /> */}
                      <Scene />
                      <Environment resolution={256}>
                        {/* Ceiling */}
                        {/* <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 10, 0]} scale={[10, 10, 1]} />
                        <Lightformer intensity={3} rotation-x={-Math.PI / 2} position={[0, -10, 0]} scale={[10, 10, 1]} /> */}
                        {/* Sides */}
                        {/* <Lightformer  intensity={3} rotation-y={Math.PI / 2} position={[-10, 0, -1]} scale={[20, 1, 1]} />
                        <Lightformer  intensity={3} rotation-y={-Math.PI / 2} position={[10, 0, 1]} scale={[20, 1, 1]} /> */}

                        {/* Background */}
                        <mesh scale={100}>
                          <sphereGeometry args={[1, 64, 64]} />
                          <LayerMaterial side={THREE.BackSide}>
                            <Color color="#FDB813" alpha={0.4} mode="normal" />
                            <Depth colorA="#f0f0f0" colorB="#f0f0f0" alpha={0.5} mode="normal" near={0} far={300} origin={[100, 100, 100]} />
                          </LayerMaterial>
                        </mesh>
                      </Environment>
                      <Preload all />
                    </Suspense>
                  </Canvas>
                </div>

                <form className="editForm3DSettings w-1/4 h-screen px-2 py-4 bg-neutral-50 border-r-2 border-gray-100 overflow-hidden">
                  <div className="flex justify-evenly mb-6 flex-wrap">
                    <label className="fileInputLabelmap" htmlFor="fileInputModel">
                      <AddIcon 
                        w={8} 
                        h={8}
                        margin="5px"
                        bgColor="teal.400" 
                        padding="5px" 
                        borderRadius="6px" 
                        color="white"
                        _hover={{ bgColor: "teal.600", padding: "8px", borderRadius: "10px" }}
                        transition={"ease-in-out 0.2s"}
                      />
                        Загрузить модель
                    </label>
                    <input
                      type="file"
                      accept="model/gltf-binary"
                      id="fileInputModel"
                      style={{ display: "none" }}
                      onChange={(e: any) => {
                        setModel(e.target.files![0]);
                        setModelURL(URL.createObjectURL(e.target.files![0]!));
                      }}
                    />
                    <Button 
                      colorScheme='teal'
                      onClick={handleSaveChanges}
                    >Сохранить</Button>
                  </div>
                  <div className="mb-6">
                    <Tabs isFitted variant='enclosed'>
                      <TabList >
                        <Tab 
                          _selected={{ color: 'white', bg: 'teal.500' }}
                          onClick={(e: any) => {setAnnotationMode(false)}}
                        >
                          Materials
                        </Tab>
                        <Tab 
                          isDisabled={loadingState}
                          _selected={{ color: 'white', bg: 'teal.500' }}
                          onClick={(e: any) => {setAnnotationMode(true)}}
                        >
                          Annotations
                        </Tab>
                      </TabList>

                      <TabPanels>
                        <TabPanel>
                          <div className="editForm3DSettings h-[80vh] pr-2 overflow-y-scroll">
                            <AddTexture 
                              Name={"Base Color Map"} 
                              Map={colorMapURL} 
                              MapURL={colorMapURL}
                              htmlForID="base_color_map" 
                              handleOnChange={(e: any) => {
                                setcolorMap(e.target.files![0]);
                                setcolorMapURL(URL.createObjectURL(e.target.files![0]!));
                              }}
                            />

                            <AddTexture 
                              Name={"Normal Map"} 
                              Map={normalMapURL} 
                              MapURL={normalMapURL} 
                              htmlForID="normal_map" 
                              handleOnChange={(e: any) => {
                                setnormalMap(e.target.files![0]);
                                setnormalMapURL(URL.createObjectURL(e.target.files![0]!));
                              }}
                            />

                            <AddTexture 
                              Name={"Metalness Map"} 
                              Map={metalnessMapURL} 
                              MapURL={metalnessMapURL} 
                              htmlForID="metalness_map" 
                              handleOnChange={(e: any) => {
                                setmetalnessMap(e.target.files![0]);
                                setmetalnessMapURL(URL.createObjectURL(e.target.files![0]!));
                              }}
                              settings={true}
                              htmlForIDSetting="metalness_value"
                              settingsValue={metalness}
                              handleOnChangeSettings={(e: any) => {setMetalness(e.target.value)}}
                            />

                            <AddTexture 
                              Name={"Roughness Map"} 
                              Map={roughnessMapURL} 
                              MapURL={roughnessMapURL} 
                              htmlForID="roughness_map" 
                              handleOnChange={(e: any) => {
                                setroughnessMap(e.target.files![0]);
                                setroughnessMapURL(URL.createObjectURL(e.target.files![0]!));
                              }}
                              settings={true}
                              htmlForIDSetting="roughness_value" 
                              settingsValue={roughness}
                              handleOnChangeSettings={(e: any) => {setRoughness(e.target.value)}}
                            />  

                            <AddTexture 
                              Name={"Ambient Occlusion Map"} 
                              Map={aoMapURL} 
                              MapURL={aoMapURL} 
                              htmlForID="ao_map"
                              handleOnChange={(e: any) => {
                                setaoMap(e.target.files![0]);
                                setaoMapURL(URL.createObjectURL(e.target.files![0]!));
                              }}
                            />
                          </div>    
                        </TabPanel>

                        <TabPanel
                          className=""
                        >
                          {
                            (counter === 0) ? (
                              <p>Кликните дважды в месте на модели, где хотите оставить Аннотацию.</p>
                            ) : (
                              <div
                                className="editForm3DSettings h-[75vh] pr-2 overflow-y-scroll"
                              >
                              {
                                annotations.map((data, i) => (
                                  <div 
                                    key={i} 
                                    ref={annotationsSettingsRefs[i]}
                                    className="bg-slate-200 mb-3 cursor-pointer"
                                    onClick={(e: any) => {
                                      setSelectedAnnotation(i)
                                      console.log(data.title)
                                    }}
                                  >
                                    <div className="flex justify-between">
                                      <p className="text-sm m-1">{i + 1}</p>
                                      <img 
                                        src={delete_icon} 
                                        className="delete_icon" 
                                        alt="Delete" 
                                        title="Delete" 
                                        onClick={(e: any) => {
                                          handleDeleteAnnotation(data, i)
                                        }}
                                      />
                                    </div>
                                    <div className="flex flex-col justify-center p-1">
                                      <Input
                                        className='mt-1 mb-1.5 focus:!bg-white hover:!bg-slate-50'
                                        focusBorderColor='rgb(226, 232, 240)'
                                        placeholder='Заголовок'
                                        size='sm'
                                        variant='filled'
                                        value={data.title}
                                        onChange={(e: any) => {
                                          handleChangeTitle(e, i)
                                        }}
                                      />
                                      {(i === selectedAnnotation) && 
                                        <Textarea
                                          className='mb-1.5 focus:!bg-white hover:!bg-slate-50 addCustomScrollbar'
                                          focusBorderColor='rgb(226, 232, 240)'
                                          placeholder='Описание'
                                          size='sm'
                                          variant='filled'
                                          resize='vertical'
                                          value={data.info}
                                          onChange={(e: any) => {
                                            handleChangeInfo(e, i)
                                          }}
                                        />
                                      }
                                    </div>
                                  </div>
                                ))
                              }
                              </div>
                            )
                          }
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </div>             

                  {screenshot && (
                    <img
                      className="ScreenShotPhoto"
                      src={URL.createObjectURL(screenshot)}
                      alt=""
                    />
                  )}

                  {/* <button
                    type="button"
                    className="ScreenShot"
                    onClick={makeScreenshot}
                  >
                    <img
                      className="ScreenShotIcon"
                      src="/img/add-photo_1.png"
                      alt=""
                    />
                    Скриншот
                  </button> */}
                </form>
                {/* <a
                  href={model3d.data.model}
                  target={"_blank"}
                  rel="noreferrer"
                  className="text-lg font-medium text-blue-500 underline"
                >
                  Скачать 3D-модель
                </a> */}
              </>
            ) : (
              "Неверный формат файла (Поддерживаемый: GLB)"
            )
          ) : (
            "Модель отсутствует"
          )}
      </div>
    </div>
  );
}

export default App;
