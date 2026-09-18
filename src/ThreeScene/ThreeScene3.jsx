import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const ThreeScene = ({
  // Offset applied AFTER the model is auto-centered at the origin.
  // e.g. { x: 3, y: 0, z: -5 } moves it 3 right, 5 back.
  modelPosition = { x: 0, y: 0, z: 2 },
  // The model is auto-scaled so its largest dimension equals this value.
  modelSize = 1
}) => {
  const mountRef = useRef(null)
  const isDraggingRef = useRef(false)
  const previousPointerRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = mountRef.current

    if (!container) return


    const scene = new THREE.Scene()


    const camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      1000
    )



    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    renderer.setClearColor(0x000000, 0)

    renderer.outputColorSpace = THREE.SRGBColorSpace

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(renderer.domElement)



    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      2
    )

    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(
      0xffffff,
      4
    )

    keyLight.position.set(5, 5, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)

    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(
      0xffffff,
      2
    )

    fillLight.position.set(-5, 3, 2)

    scene.add(fillLight)

    const backLight = new THREE.DirectionalLight(
      0xffffff,
      2
    )

    backLight.position.set(0, 5, -5)

    scene.add(backLight)



    let model = null
    let baseScale = 1

    // The container width (in px) at which the model renders at
    // baseScale. As the container shrinks/grows below/above this,
    // the model's actual scale is adjusted proportionally in resize().
    const REFERENCE_SIZE = 390

    // The pivot is what we actually spin/drag. Keeping the orientation
    // fix on the model (baked in once, never touched again) and doing
    // all interactive rotation on this wrapper instead means the spin
    // happens around the true world axis — so it looks like a coin
    // turning on a turntable (face, edge, back, edge...) instead of
    // spinning flat in place like a disc in a disc player.
    const pivot = new THREE.Group()
    scene.add(pivot)

    const loader = new GLTFLoader()

    loader.load(
      '/models/engineering-logo.glb',

      (gltf) => {
        console.log('3D model loaded successfully')

        model = gltf.scene

        // Add model to the pivot, not directly to the scene
        pivot.add(model)

        // The exported model is a flat medallion whose face points
        // toward +Y (thickness axis), but our camera looks down the
        // Z axis. Rotate the face to point toward +Z so it's seen
        // head-on instead of edge-on. Flip the sign to -Math.PI / 2
        // if this shows the backside instead. This is a one-time fix
        // baked into the model — animation below rotates the pivot.
        model.rotateX(Math.PI / 2)

        // The face-on fix above left the badge upside down (rotated
        // 180° within its own face). Spin it back around the axis
        // that's now pointing at the camera to right it. Using
        // rotateY here (rather than reassigning rotation.z) applies
        // in the model's own local space, composing correctly with
        // the rotation above instead of fighting Euler-angle order.
        model.rotateY(Math.PI)

        const box = new THREE.Box3().setFromObject(model)

        const center = new THREE.Vector3()

        const size = new THREE.Vector3()

        box.getCenter(center)
        box.getSize(size)

        console.log('Model size:', size)
        console.log('Model center:', center)



        model.position.x -= center.x
        model.position.y -= center.y
        model.position.z -= center.z

        // The position offset goes on the pivot, not the model. If it
        // were applied to the model itself, the model would sit off
        // to the side of the pivot's rotation origin, so rotating the
        // pivot would make it orbit in a circle instead of spinning
        // in place around its own center.
        pivot.position.set(
          modelPosition.x,
          modelPosition.y,
          modelPosition.z
        )



        const maxDimension = Math.max(
          size.x,
          size.y,
          size.z
        )

        if (maxDimension > 0) {
          baseScale =
            modelSize / maxDimension

          const responsiveFactor =
            container.clientWidth / REFERENCE_SIZE

          model.scale.setScalar(baseScale * responsiveFactor)
        }

   

        camera.position.set(
          0,
          0,
          5
        )

        camera.lookAt(
          0,
          0,
          0
        )

   

        model.traverse((object) => {
          if (object.isMesh) {

            object.castShadow = true
            object.receiveShadow = true

            // Make sure materials remain visible
            if (object.material) {
              object.material.needsUpdate = true
            }
          }
        })
      },


      (xhr) => {
        if (xhr.total) {
          const percent =
            (xhr.loaded / xhr.total) * 100

          console.log(
            `Loading 3D model: ${percent.toFixed(0)}%`
          )
        }
      },

   

      (error) => {
        console.error(
          'FAILED TO LOAD 3D MODEL:',
          error
        )
      }
    )

 

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight

      if (width === 0 || height === 0) return

      camera.aspect = width / height

      camera.updateProjectionMatrix()

      renderer.setSize(
        width,
        height,
        false
      )

      if (model) {
        const responsiveFactor = width / REFERENCE_SIZE

        model.scale.setScalar(baseScale * responsiveFactor)
      }
    }

    resize()

    // ResizeObserver catches container size changes that don't
    // come from a window resize (e.g. sidebar toggle, flex/grid
    // layout shifts, parent element resizing).
    const resizeObserver = new ResizeObserver(() => {
      resize()
    })

    resizeObserver.observe(container)



    const handlePointerDown = (event) => {
      isDraggingRef.current = true
      previousPointerRef.current = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const handlePointerMove = (event) => {
      if (!isDraggingRef.current || !model) return

      const deltaX = event.clientX - previousPointerRef.current.x
      const deltaY = event.clientY - previousPointerRef.current.y

      pivot.rotation.y += deltaX * 0.01
      pivot.rotation.x += deltaY * 0.01

      previousPointerRef.current = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const handlePointerUp = () => {
      isDraggingRef.current = false
    }

    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)



    let animationFrameId

    const animate = () => {
      animationFrameId =
        requestAnimationFrame(animate)

      if (model && !isDraggingRef.current) {
        pivot.rotation.y += 0.02
      }

      renderer.render(
        scene,
        camera
      )
    }

    animate()

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      cancelAnimationFrame(
        animationFrameId
      )

      resizeObserver.disconnect()

      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      if (
        container &&
        renderer.domElement
      ) {
        container.removeChild(
          renderer.domElement
        )
      }

      renderer.dispose()

      if (model) {
        model.traverse((object) => {
          if (object.isMesh) {

            if (object.geometry) {
              object.geometry.dispose()
            }

            if (object.material) {
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material]

              materials.forEach((material) => {
                // Dispose any textures attached to the material
                // (map, normalMap, roughnessMap, etc.) — otherwise
                // they leak on the GPU across mount/unmount cycles.
                Object.values(material).forEach((value) => {
                  if (value && value.isTexture) {
                    value.dispose()
                  }
                })

                material.dispose()
              })
            }
          }
        })
      }
    }
  }, [modelPosition.x, modelPosition.y, modelPosition.z, modelSize])

  return (
    <div
      ref={mountRef}
      style={{
        width: 'clamp(200px, 45vw, 390px)',
        height: 'clamp(200px, 45vw, 390px)',
        overflow: 'hidden',
        position: 'relative',
        margin: '10px',
        cursor: 'grab',
        touchAction: 'none',
        borderRadius: '15px',
        transform: 'translateX(clamp(30px, 8vw, 60px))',
      }}
    />
  )
}

export default ThreeScene
