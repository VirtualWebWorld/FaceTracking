import '../css/style.scss'

import * as tf from '@tensorflow/tfjs';
require('@tensorflow/tfjs-backend-wasm');
const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');
import {
	TRIANGULATION
} from './triangulation'

const videoWidth = 300 * 3;
const videoHeight = 200 * 3;

const state = {
	maxFaces: 1,
	triangulateMesh: true
};

let model, video, ctx, canvas;
(function () {
	// tf.setBackend('wasm').then(() => main());
	main()
	async function main() {
		await setupCamera();
		video.play();

		canvas = document.getElementById('output');
		canvas.width = videoWidth;
		canvas.height = videoHeight;

		ctx = canvas.getContext('2d');
		ctx.translate(canvas.width, 0);
		ctx.scale(-1, 1);
		ctx.fillStyle = '#32EEDB';
		ctx.strokeStyle = '#32EEDB';
		ctx.lineWidth = 0.5;

		model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
			maxFaces: state.maxFaces
		});

		renderPrediction();
	}

	async function setupCamera() {
		video = document.getElementById('video');

		const stream = await navigator.mediaDevices.getUserMedia({
			'audio': false,
			'video': {
				facingMode: 'user',
				width: videoWidth,
				height: videoHeight
			},
		});
		video.srcObject = stream;

		return new Promise((resolve) => {
			video.onloadedmetadata = () => {
				resolve(video);
			};
		});
	}

	async function renderPrediction() {

		const predictions = await model.estimateFaces({
			input: document.getElementById("video")
		})
		ctx.drawImage(
			video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);

		if (predictions.length > 0) {
			predictions.forEach(prediction => {
				const keypoints = prediction.scaledMesh;

				if (state.triangulateMesh) {
					for (let i = 0; i < TRIANGULATION.length / 3; i++) {
						const points = [
							TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
							TRIANGULATION[i * 3 + 2]
						].map(index => keypoints[index]);
						drawPath(ctx, points, true);
					}
				}
			});
		}
		requestAnimationFrame(renderPrediction);
	}

	function drawPath(ctx, points, closePath) {
		const region = new Path2D();
		region.moveTo(points[0][0], points[0][1]);
		for (let i = 1; i < points.length; i++) {
			const point = points[i];
			region.lineTo(point[0], point[1]);
		}

		if (closePath) {
			region.closePath();
		}
		ctx.stroke(region);
	}
})()