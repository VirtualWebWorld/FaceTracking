import * as PIXI from 'pixi.js'
import '../css/style.scss'

import '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-wasm'
import * as FLD from '@tensorflow-models/face-landmarks-detection'
import {
  TRIANGULATION
} from './triangulation'
import Camera from './camera'
import CameraCanvas from './canvas'

const g = []

let model, video, cc
(async function main () {
  video = await Camera()

  model = await FLD.load(FLD.SupportedPackages.mediapipeFacemesh, {
    maxFaces: 1
  })

  cc = new CameraCanvas(video)

  renderPrediction()
})()

async function renderPrediction () {
  const predictions = await model.estimateFaces({
    input: video
  })

  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      const keypoints = prediction.scaledMesh
      deleteGraphics()
      for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        const points = [
          TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
          TRIANGULATION[i * 3 + 2]
        ].map((index) => keypoints[index])
        drawPath(points, i)
      }
    })
  }
  cc.animate()
  requestAnimationFrame(renderPrediction)
}

function deleteGraphics () {
  g.forEach((e) => {
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
