import * as PIXI from 'pixi.js'

export default class CameraCanvas {
  constructor (video) {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.stage = new PIXI.Container()
    this.renderer = PIXI.autoDetectRenderer({
      width: 300,
      height: 200,
      resolution: 1,
      antialias: true
      // transparent: true,
    })
    document.getElementById('pixiview').appendChild(this.renderer.view)
    this.addVideo(video)
  }

  addVideo (video) {
    // eslint-disable-next-line new-cap
    const v = new PIXI.Sprite(new PIXI.Texture.from(video))
    this.stage.addChild(v)
  }

  addStage (g) {
    this.stage.addChild(g)
  }

  deleteStage (g) {
    this.stage.removeChild(g)
  }

  animate () {
    this.renderer.render(this.stage)
  }
}
