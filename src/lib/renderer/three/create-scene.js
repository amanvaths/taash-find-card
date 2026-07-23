import * as THREE from 'three';

/**
 * @param {HTMLElement} container
 * @returns {{
 *   renderer: import('three').WebGLRenderer,
 *   scene: import('three').Scene,
 *   camera: import('three').PerspectiveCamera,
 *   table: import('three').Mesh,
 *   particles: import('three').Points,
 *   clock: import('three').Clock,
 *   onContextLost: ((event: Event) => void) | null
 * }}
 */
export function createScene(container) {
	const width = container.clientWidth || window.innerWidth;
	const height = container.clientHeight || window.innerHeight;

	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setSize(width, height, false);
	renderer.setClearColor(0x000000, 0);
	container.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
	camera.position.set(0, 8.5, 11.5);
	camera.lookAt(0, 0, 0);

	const ambient = new THREE.AmbientLight(0xffffff, 0.55);
	scene.add(ambient);

	const key = new THREE.DirectionalLight(0xfff2d6, 0.85);
	key.position.set(4, 10, 6);
	scene.add(key);

	const fill = new THREE.DirectionalLight(0xa8c4ff, 0.25);
	fill.position.set(-6, 4, -2);
	scene.add(fill);

	const tableGeometry = new THREE.CircleGeometry(7.5, 64);
	const tableMaterial = new THREE.MeshStandardMaterial({
		color: 0x3d2410,
		roughness: 0.85,
		metalness: 0.05
	});
	const table = new THREE.Mesh(tableGeometry, tableMaterial);
	table.rotation.x = -Math.PI / 2;
	table.position.y = -0.2;
	scene.add(table);

	const rimGeometry = new THREE.RingGeometry(7.5, 7.85, 64);
	const rimMaterial = new THREE.MeshStandardMaterial({
		color: 0x1a0e08,
		roughness: 0.7,
		metalness: 0.1,
		side: THREE.DoubleSide
	});
	const rim = new THREE.Mesh(rimGeometry, rimMaterial);
	rim.rotation.x = -Math.PI / 2;
	rim.position.y = -0.19;
	rim.name = 'table-rim';
	scene.add(rim);

	const particleCount = 48;
	const positions = new Float32Array(particleCount * 3);
	for (let i = 0; i < particleCount; i += 1) {
		const t = i / particleCount;
		positions[i * 3] = Math.cos(t * Math.PI * 8) * (2 + (i % 5));
		positions[i * 3 + 1] = 0.4 + (i % 7) * 0.25;
		positions[i * 3 + 2] = Math.sin(t * Math.PI * 8) * (2 + (i % 4));
	}
	const particleGeometry = new THREE.BufferGeometry();
	particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	const particleMaterial = new THREE.PointsMaterial({
		color: 0xe8b84a,
		size: 0.06,
		transparent: true,
		opacity: 0.0,
		depthWrite: false
	});
	const particles = new THREE.Points(particleGeometry, particleMaterial);
	scene.add(particles);

	const clock = new THREE.Clock();

	/** @type {((event: Event) => void) | null} */
	let onContextLost = null;

	return { renderer, scene, camera, table, particles, clock, onContextLost };
}
