/**
 * @param {import('three').WebGLRenderer} renderer
 * @param {import('three').PerspectiveCamera} camera
 * @param {HTMLElement} container
 */
export function resizeRenderer(renderer, camera, container) {
	const width = container.clientWidth || window.innerWidth;
	const height = container.clientHeight || window.innerHeight;
	if (width <= 0 || height <= 0) return;

	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setSize(width, height, false);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
}
