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

    // ==========================================
    // SCENE
    // ==========================================

    const scene = new THREE.Scene()

    // ==========================================
    // CAMERA
    // ==========================================

    const camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      1000
    )

    // ==========================================
    // RENDERER
    // ==========================================

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    renderer.setClearColor(0xf5f5f5, 1)

    renderer.outputColorSpace = THREE.SRGBColorSpace

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(renderer.domElement)

    // ==========================================
    // LIGHTING
    // ==========================================

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

    // ==========================================
    // MODEL
    // ==========================================

    let model = null
    let baseScale = 1

    // The container width (in px) at which the model renders at
    // baseScale. As the container shrinks/grows below/above this,
    // the model's actual scale is adjusted proportionally in resize().
    const REFERENCE_SIZE = 300

    const loader = new GLTFLoader()

    loader.load(
      '/models/ultrasonic-holder.glb',

      (gltf) => {
        console.log('3D model loaded successfully')

        model = gltf.scene

        // Add model to scene
        scene.add(model)

        // ======================================
        // CALCULATE MODEL BOUNDING BOX
        // ======================================

        const box = new THREE.Box3().setFromObject(model)

        const center = new THREE.Vector3()

        const size = new THREE.Vector3()

        box.getCenter(center)
        box.getSize(size)

        console.log('Model size:', size)
        console.log('Model center:', center)

        // ======================================
        // CENTER MODEL
        // ======================================

        model.position.x -= center.x
        model.position.y -= center.y
        model.position.z -= center.z

        model.position.x += modelPosition.x
        model.position.y += modelPosition.y
        model.position.z += modelPosition.z

        // ======================================
        // SCALE MODEL
        // ======================================

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

        // ======================================
        // CAMERA POSITION
        // ======================================

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

        // ======================================
        // KEEP ORIGINAL MODEL MATERIALS
        // ======================================

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

      // ========================================
      // LOADING PROGRESS
      // ========================================

      (xhr) => {
        if (xhr.total) {
          const percent =
            (xhr.loaded / xhr.total) * 100

          console.log(
            `Loading 3D model: ${percent.toFixed(0)}%`
          )
        }
      },

      // ========================================
      // ERROR
      // ========================================

      (error) => {
        console.error(
          'FAILED TO LOAD 3D MODEL:',
          error
        )
      }
    )

    // ==========================================
    // RESIZE
    // ==========================================

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

    // ==========================================
    // DRAG TO ROTATE
    // ==========================================

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

      model.rotation.y += deltaX * 0.01
      model.rotation.x += deltaY * 0.01

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

    // ==========================================
    // ANIMATION
    // ==========================================

    let animationFrameId

    const animate = () => {
      animationFrameId =
        requestAnimationFrame(animate)

      // ======================================
      // CONTINUOUS SLOW ROTATION
      // ======================================

      if (model && !isDraggingRef.current) {
        model.rotation.y += 0.003
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
        width: 'clamp(150px, 40vw, 300px)',
        height: 'clamp(150px, 40vw, 300px)',
        overflow: 'hidden',
        position: 'relative',
        margin: '50px',
        cursor: 'grab',
        touchAction: 'none',
        borderRadius: '15px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.1)',
        transform: 'translate(clamp(10px, 2.67vw, 20px), clamp(-50px, -6.67vw, -25px))',
      }}
    />
  )
}

export default ThreeScene