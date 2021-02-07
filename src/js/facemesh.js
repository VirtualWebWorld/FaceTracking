import * as THREE from 'three'
import {
  TRIANGULATION
} from './triangulation'

export default class FaceMesh {
  constructor () {
    this.geometry = THREE.BufferGeometry()
    this.scene = new THREE.Scene()
    this.canvas = document.getElementById('threejs_canvas')
    this.render = new THREE.WebGLRenderer({
      // alpha: true,
      antialias: true
    })
    this.render.setPixelRatio(window.devicePixelRatio)
    this.width = 500
    this.height = 500
    this.render.setSize(this.width, this.height)
    this.render.setClearColor(0x000000, 0)
    this.canvas.appendChild(this.render.domElement)

    this.material = new THREE.MeshBasicMaterial()
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.rotation.set(Math.PI, Math.PI, 0)
    this.scene.add(this.mesh)

    this.modelWidth = 256
    this.modelHeight = 128

    this.camera = this.settingCamera()
  }

  async setUp (model) {
    this.modelCanvas = document.getElementById('model_canvas')
    this.modelCanvas.width = this.modelWidth
    this.modelCanvas.height = this.modelHeight
    await this.setupModelCanvas()
    await this.threejsRenderPrediction(model)
  }

  settingCamera () {
    const fov = 1
    const fovRad = (fov / 2) * (Math.PI / 180)
    const dist = (this.height / 2) / Math.tan(fovRad)

    const camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 1, dist * 2)
    camera.position.z = dist
    camera.position.x = this.width / 2 * -1
    camera.position.y = this.height / 2 * -1

    return camera
  }

  async setupModelCanvas () {
    const modelCtx = this.modelCanvas.getContext('2d')

    const src = './image/hair_biyou_kirei_ojiisan.png'
    const img = await this.loadImage(src).catch((e) => {
      console.log('onload error', e)
    })
    modelCtx.drawImage(img, 0, 0, this.modelWidth, this.modelHeight)
  }

  async loadImage (src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  async threejsRenderPrediction (model) {
    const predictions = await model.estimateFaces({
      input: this.modelCanvas
    })
    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        const keypoints = prediction.scaledMesh
        this.threejsCreateMesh(keypoints)
      })
    }
  }

  threejsCreateMesh (keypoints) {
    const texture = new THREE.CanvasTexture(this.modelCanvas)
    texture.flipY = false

    const pos = new Float32Array(
      Array.prototype.concat.apply([], TRIANGULATION.map((index) => keypoints[index])))

    const uv = new Float32Array(
      Array.prototype.concat.apply([], TRIANGULATION.map((index) => [keypoints[index][0] / this.modelWidth, keypoints[index][1] / this.modelHeight])))

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))

    this.mesh.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    })
    this.render.render(this.scene, this.camera)
  }

  threejsUpdateMesh (keypoints) {
    this.mesh.geometry.attributes.position.needsUpdate = true
    this.mesh.geometry.attributes.position.array = new Float32Array(
      Array.prototype.concat.apply([], TRIANGULATION.map((index) => keypoints[index])))
    this.render.render(this.scene, this.camera)
  }

  animate (keypoints) {
    this.threejsUpdateMesh(keypoints)
  }
}
