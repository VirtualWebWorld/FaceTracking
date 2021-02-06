const videoWidth = 900
const videoHeight = 600

export const camera = async () => {
  const video = await setupCamera()
  video.play()
}

async function setupCamera () {
  const video = document.getElementById('video')

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user',
      width: videoWidth,
      height: videoHeight
    }
  })
  video.srcObject = stream

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
}
