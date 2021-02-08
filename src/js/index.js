import * as PIXI from 'pixi.js'
import '../css/style.scss'

import '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-wasm'
import * as FLD from '@tensorflow-models/face-landmarks-detection'
import Stats from 'stats.js'

import {
  TRIANGULATION
} from './triangulation'
import Camera from './camera'
import CameraCanvas from './cameracanvas'
// import FaceMesh from './facemesh'
import FaceVRM from './facevrm'

const g = []
const ccArr = []

let model,
  video,
  cc,
  stats,
  fv
  // fm
(async function main () {
  video = await Camera()

  model = await FLD.load(FLD.SupportedPackages.mediapipeFacemesh, {
    maxFaces: 1
  })

  stats = new Stats()
  stats.showPanel(0)
  document.body.appendChild(stats.dom)

  cc = new CameraCanvas(video)
  // fm = new FaceMesh()
  fv = new FaceVRM()
  // await fm.setUp(model)

  renderPrediction()
})()

async function renderPrediction () {
  stats.begin()
  const predictions = await model.estimateFaces({
    input: video
  })

  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      deleteGraphics()
      const keypoints = prediction.scaledMesh
      const an = prediction.annotations
      for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        const points = [
          TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]
        ].map((index) => keypoints[index])
        drawPath(points, i)
      }

      // ccArr.push(...createPoint(an.lipsUpperInner, 0xff0000))// 11
      // ccArr.push(...createPoint(an.lipsLowerInner, 0x00ff00))// 11
      // ccArr.push(...createPoint(an.leftEyeUpper0, 0xff0000))// 7
      // ccArr.push(...createPoint(an.leftEyeLower0, 0x00ff00))// 9
      // ccArr.push(...createPoint(an.rightEyeUpper0, 0xff0000))// 7
      // ccArr.push(...createPoint(an.rightEyeLower0, 0x00ff00))// 9
      // fm.animate(keypoints)
      fv.animate(prediction)
    })
  }
  cc.animate()
  stats.end()
  requestAnimationFrame(renderPrediction)
}

function createPoint (arr, color) {
  const point = [...arr]
  const rArr = []
  for (let i = 0; i < point.length; i++) {
    const x = point[i][0]
    const y = point[i][1]
    rArr.push(cc.createCircle(x, y, 3, color))
  }
  return rArr
}

function deleteGraphics () {
  g.forEach((e) => {
    cc.deleteStage(e)
  })
  ccArr.forEach((e) => {
    cc.deleteStage(e)
  })
}

function drawPath (points, p) {
  g[p] = new PIXI.Graphics()
  g[p].lineStyle(1, 0x32EEDB)
  g[p].moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    g[p].lineTo(point[0], point[1])
  }
  cc.addStage(g[p])
}
