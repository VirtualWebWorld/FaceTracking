import * as PIXI from 'pixi.js'

export default class CameraCanvas {
  constructor (video) {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.stage = new PIXI.Container()
    this.renderer = PIXI.autoDetectRenderer({
      width: 500,
      height: 500,
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

  createCircle (x, y, r, color) {
    const g = new PIXI.Graphics()
    g.lineStyle(0)
    g.beginFill(color, 1)
    g.drawCircle(x, y, r)
    g.endFill()
    this.addStage(g)
    return g
  }

  animate () {
    this.renderer.render(this.stage)
  }
}
