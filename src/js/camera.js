const videoWidth = 500
const videoHeight = 500

const camera = async () => {
  const video = await setupCamera()
  video.play()
  return video
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

export default camera
