import * as tf from '@tensorflow/tfjs'
import * as THREE from 'three'
import {
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader'
import {
  VRM,
  VRMSchema
} from '@pixiv/three-vrm'

export default class FaceVRM {
  constructor () {
    this.scene = new THREE.Scene()
    this.canvas = document.getElementById('vrmCanvas')
    this.render = new THREE.WebGLRenderer({
      // alpha: true,
      antialias: true
    })
    this.render.setPixelRatio(window.devicePixelRatio)
    this.width = 500
    this.heitght = 500
    this.render.setSize(this.width, this.heitght)
    this.render.setClearColor(0x000000, 0)
    this.canvas.appendChild(this.render.domElement)

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.heitght,
      0.1,
      1000
    )
    this.camera.position.set(0.0, 0.8, 0.5)
    this.scene = new THREE.Scene()

    this.light = new THREE.DirectionalLight(0xffffff)
    this.light.position.set(1.0, 1.0, 1.0).normalize()
    this.scene.add(this.light)

    this.clock = new THREE.Clock()
    this.clock.start()

    this.currentVRM = undefined
    this.modelLoadFlag = false
    this.modelLoad()
  }

  modelLoad () {
    const loader = new GLTFLoader()
    loader.load(
      './akatsuki1910.vrm',
      (gltf) => {
        VRM.from(gltf).then((vrm) => {
          this.scene.add(vrm.scene)
          this.currentVRM = vrm

          vrm.scene.rotation.y = Math.PI
          vrm.scene.position.y -= 0.5

          vrm.humanoid.setPose({
            [VRMSchema.HumanoidBoneName.LeftUpperArm]: {
              rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.0, 0.0, 1.1)).toArray()
            },
            [VRMSchema.HumanoidBoneName.RightUpperArm]: {
              rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.0, 0.0, -1.1)).toArray()
            }
          })
          this.render.render(this.scene, this.camera)
          this.modelLoadFlag = true
        })
      },
      (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
      (error) => console.error(error)
    )
  }

  headPoseEstimation (faces, rightEye, leftEye) {
    const rotate = tf.tidy(() => {
      const fecePoints = tf.tensor(faces)
      const eye1 = tf.tensor1d(rightEye)
      const eye2 = tf.tensor1d(leftEye)
      const scales = fecePoints.div(tf.norm(eye1.sub(eye2))).mul(0.06)
      const centered = scales.sub(scales.mean(0))

      const c00 = centered.slice(0, 1).as1D()
      const c09 = centered.slice(9, 1).as1D()
      const c18 = centered.slice(18, 1).as1D()
      const c27 = centered.slice(27, 1).as1D()

      const rotate0 = c18.sub(c00).div(tf.norm(c18.sub(c00)))
      const rotate1 = c09.sub(c27).div(tf.norm(c09.sub(c27)))

      return tf.concat([rotate0, rotate1]).arraySync()
    })
    const m00 = rotate[0]
    const m01 = rotate[1]
    const m02 = rotate[2]

    const m10 = rotate[3]
    const m11 = rotate[4]
    const m12 = rotate[5]

    const m20 = m01 * m12 - m02 * m11
    const m21 = m02 * m10 - m00 * m12
    const m22 = m00 * m11 - m01 * m10
    let yaw, pitch, roll
    const sy = Math.sqrt(m00 * m00 + m10 * m10)
    const singular = sy < 10 ** -6

    if (!singular) {
      yaw = Math.atan2(m21, m22)
      pitch = Math.atan2(-m20, sy)
      roll = Math.atan2(m10, m00)
    } else {
      yaw = Math.atan2(-m12, m11)
      pitch = Math.atan2(-m20, sy)
      roll = 0
    }

    const head = this.currentVRM.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Head)
    head.rotation.set(yaw + Math.PI, pitch, -(roll - Math.PI / 2), 'XYZ')
    this.render.render(this.scene, this.camera)
  }

  faceMove (an) {
    document.getElementById('ulipsXPosition').innerHTML = an.lipsUpperInner[6][0]
    document.getElementById('ulipsYPosition').innerHTML = an.lipsUpperInner[6][1]
    document.getElementById('llipsXPosition').innerHTML = an.lipsLowerInner[6][0]
    document.getElementById('llipsYPosition').innerHTML = an.lipsLowerInner[6][1]
    document.getElementById('ulEyeXPosition').innerHTML = an.leftEyeUpper0[3][0]
    document.getElementById('ulEyeYPosition').innerHTML = an.leftEyeUpper0[3][1]
    document.getElementById('llEyeXPosition').innerHTML = an.leftEyeLower0[6][0]
    document.getElementById('llEyeYPosition').innerHTML = an.leftEyeLower0[6][1]
    document.getElementById('urEyeXPosition').innerHTML = an.rightEyeUpper0[3][0]
    document.getElementById('urEyeYPosition').innerHTML = an.rightEyeUpper0[3][1]
    document.getElementById('lrEyeXPosition').innerHTML = an.rightEyeLower0[6][0]
    document.getElementById('lrEyeYPosition').innerHTML = an.rightEyeLower0[6][1]
    this.lipMove(an)
    this.rightEyeMove(an)
    this.leftEyeMove(an)
  }

  lipMove (an) {
    const lipWidth = an.lipsLowerInner[6][1] - an.lipsUpperInner[6][1]
    let lipRatio = (lipWidth - 2) / 20
    lipRatio = (lipRatio < 0) ? 0 : (lipRatio > 1 ? 1 : lipRatio)
    this.currentVRM.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.A, lipRatio)
  }

  rightEyeMove (an) {
    const rEyeWidth = an.rightEyeLower0[6][1] - an.rightEyeUpper0[3][1]
    let rEyeRatio = 1 - (rEyeWidth - 2) / 3
    rEyeRatio = (rEyeRatio < 0) ? 0 : (rEyeRatio > 1 ? 1 : rEyeRatio)
    this.currentVRM.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.BlinkR, rEyeRatio)
  }

  leftEyeMove (an) {
    const lEyeWidth = an.leftEyeLower0[6][1] - an.leftEyeUpper0[3][1]
    let lEyeRatio = 1 - (lEyeWidth - 2) / 3
    lEyeRatio = (lEyeRatio < 0) ? 0 : (lEyeRatio > 1 ? 1 : lEyeRatio)
    this.currentVRM.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.BlinkL, lEyeRatio)
  }

  animate (prediction) {
    const an = prediction.annotations
    const rightEyeLower1 = an.rightEyeLower1[8]
    const leftEyeLower1 = an.leftEyeLower1[8]
    if (this.modelLoadFlag) {
      this.headPoseEstimation(an.silhouette, rightEyeLower1, leftEyeLower1)
      this.faceMove(an)
      this.currentVRM.update(this.clock.getDelta())
    }
  }
}
