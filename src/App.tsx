import React, { createRef, Suspense, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import * as THREE from "three";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Bounds, Center as DreiCenter, Environment, Float, Html, Lightformer, Loader, OrbitControls, Preload, useGLTF, useProgress } from '@react-three/drei';
import { Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from '@chakra-ui/react';
import { Image as DreiImage } from '@react-three/drei'
import AddTexture from './components/addTexture/addTexture';
import { AddIcon } from '@chakra-ui/icons';
import null_texture from './models/null_texture.png'
import null_texture_normal from './models/null_texture_normal.png'
import annotation_icon from './models/annotation-icon.png'
import { Color, Depth, LayerMaterial } from 'lamina';
import AnnotationsMap from './components/annotationsMap/AnnotationsMap';

function App() {

  const [hovered, setHovered] = useState(false)

  const [counter, setCounter] = useState<number>(0);
  const maxCounter = 10
  const [annotationsPositions, setaAnnotationsPositions] = useState<Array<THREE.Vector3>>([]);

  const [annotationMode, setAnnotationMode] = useState<boolean>(false);
  const occludeRef = createRef<THREE.Object3D<Event>>();

  const [loadingState, setloadingState] = useState<boolean>(true);
  
  const [screenshot, setScreenshot] = useState<any | null>(null);

  const [model, setModel] = useState<any | null>(null);
  const [modelURL, setModelURL] = useState("");

  // set Maps for 3D-Model
  const [colorMap, setcolorMap] = useState<any | null>(null);
  const [colorMapURL, setcolorMapURL] = useState("");

  const [normalMap, setnormalMap] = useState<any | null>(null);
  const [normalMapURL, setnormalMapURL] = useState("");

  const [metalnessMap, setmetalnessMap] = useState<any | null>(null);
  const [metalnessMapURL, setmetalnessMapURL] = useState("");
  const [metalness, setMetalness] = useState("0");

  const [roughnessMap, setroughnessMap] = useState<any | null>(null);
  const [roughnessMapURL, setroughnessMapURL] = useState("");
  const [roughness, setRoughness] = useState("1");

  const [aoMap, setaoMap] = useState<any | null>(null);
  const [aoMapURL, setaoMapURL] = useState("");

  const [uploading, setUploading] = useState<boolean>(false);

  const { active } = useProgress()

  const toast = useToast();

  // create Scene to set model and properties
  // non-null assertion operator ! - to prevent [Object is possibly 'null' or 'undefined']
  function Scene() {

    const state = useThree()

    const { width, height } = state.viewport

    const [colormap, normalmap, metalnessmap, roughnessmap, aomap] = useLoader(
      TextureLoader,
      [
        colorMapURL ? colorMapURL : null_texture,
        normalMapURL ? normalMapURL : null_texture_normal,
        metalnessMapURL ? metalnessMapURL : null_texture,
        roughnessMapURL ? roughnessMapURL : null_texture,
        aoMapURL ? aoMapURL : null_texture,
      ]
    );

    colormap!.flipY = false;
    normalmap!.flipY = false;
    metalnessmap!.flipY = false;
    roughnessmap!.flipY = false;
    aomap!.flipY = false;

    let myMaterial = new THREE.MeshPhysicalMaterial({
      color: "#000",
      map: colormap,
      normalMap: normalmap,
      metalnessMap: metalnessmap,
      metalness: parseFloat(metalness),
      roughnessMap: roughnessmap,
      roughness: parseFloat(roughness),
      aoMap: aomap,
    });

    // const fbx = useLoader(FBXLoader, `${model3d.data!.model}`);
    // fbx.traverse(function (child) {
    //   if ((child as THREE.Mesh).isMesh) {
    //     (child as THREE.Mesh).material = material;
    //     (child as THREE.Mesh).castShadow = true;
    //     (child as THREE.Mesh).receiveShadow = true;
    //   }
    // });

    const gltf = useGLTF(`${modelURL}`);
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
    });

    const sceneBox = new THREE.Box3().setFromObject( gltf.scene ); 
    const sceneSize = sceneBox.getSize(new THREE.Vector3());

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );
    const line = new THREE.Line( geometry, new THREE.LineBasicMaterial({color: 0x000000}) );
    // state.scene.add( line );

    const mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
    mouseHelper.visible = false;
    state.scene.add( mouseHelper );

    const intersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] | undefined = []

    const intersection = {
      intersects: true,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3()
    }

    let p = new THREE.Vector3
    let n = new THREE.Vector3

    let moved = false;

    window.addEventListener( 'pointermove', function () {

      moved = false;

    } );

    window.addEventListener( 'dblclick', function ( ) {

        if ( annotationMode && (moved === false) && intersection.intersects && (counter < maxCounter) ) placeAnnotation();
        
    } );

    function placeAnnotation() {
      if (counter === (maxCounter - 1)) {
        toast({
          title: "Ограничено",
          description: `Можно добавлять не более ${maxCounter} аннотаций`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }
      setCounter(counter + 1)
      annotationsPositions[counter] = n
    }

    useEffect(() => {
      document.body.style.cursor = hovered ? 'pointer' : 'auto'
    }, [hovered])

    useFrame((state) => {
      setloadingState(active)

      if (annotationMode && (moved === false)) {

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
        <Bounds fit clip observe damping={0} margin={1.2}>
          <DreiCenter>
            <primitive
              ref={occludeRef}
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
            url={annotation_icon}
            positions={annotationsPositions}
            scale={((sceneSize.x + sceneSize.y + sceneSize.z) / 3) / 15}
            sceneSize={sceneSize}
            opacity={0.8}
          />

        <OrbitControls enableDamping={false} onChange={(e: any) => {moved = true}} onEnd={(e: any) => {moved = false}}/>
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
                      
                      
                      
                      {
                        // (!annotationMode) && (
                          // <Html
                          //   as='div' // Wrapping element (default: 'div')
                          //   position={[-0.008497950134235694,0.02232144777527406,0.011595928672035922]}
                          //   distanceFactor={0.06} 
                          //   zIndexRange={[100, 0]} // Z-order range (default=[16777271, 0])
                          //   center
                          // >
                            
                          //   <button 
                          //     className="w-7 h-7 bg-teal-400 rounded-full"
                          //     onClick={(e: any) => {setAnnotationOpened(!annotationOpened)}}
                          //   ></button>
                          //   { annotationOpened && <textarea defaultValue={"Hello World"}></textarea>}
                          // </Html>
                        // )
                      }
                      
                      <Preload all />
                    </Suspense>
                  </Canvas>
                  {/* <div className="absolute bottom-3 right-3">
                    <label htmlFor="annotationSwitch"  className="px-2 mx-auto font-medium text-black transition-al">Добавить Аннотацию</label>
                    <Switch id="annotationSwitch" colorScheme='teal' size='lg' onChange={(e: any) => {setAnnotationMode(!annotationMode)}}/>
                  </div> */}
                </div>

                <form className="editForm3DSettings w-1/4 h-screen px-2 py-4 bg-neutral-50 border-r-2 border-gray-100 overflow-hidden">
                  <div className="flex justify-center mb-6 flex-wrap">
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

                        <TabPanel>
                          <p>Кликните дважды в месте на модели, где хотите оставить Аннотацию.</p>
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
