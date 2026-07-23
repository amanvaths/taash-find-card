/**
 * @param {import('three').Points} particles
 * @param {'idle' | 'win' | 'lose'} mode
 * @param {number} elapsed
 */
export function updateEffects(particles, mode, elapsed) {
	const material = /** @type {import('three').PointsMaterial} */ (particles.material);
	const positions = /** @type {import('three').BufferAttribute} */ (
		particles.geometry.getAttribute('position')
	);

	if (mode === 'idle') {
		material.opacity = Math.max(0, material.opacity - 0.02);
		return false;
	}

	if (mode === 'win') {
		material.opacity = Math.min(0.85, 0.2 + Math.sin(elapsed * 4) * 0.15 + 0.4);
		material.color.setHex(0xe8b84a);
		for (let i = 0; i < positions.count; i += 1) {
			const ix = i * 3;
			const y = positions.array[ix + 1] + 0.01 + (i % 5) * 0.001;
			positions.array[ix + 1] = y > 4 ? 0.3 : y;
			positions.array[ix] += Math.sin(elapsed + i) * 0.002;
		}
		positions.needsUpdate = true;
		return elapsed < 2.2;
	}

	material.opacity = Math.min(0.55, 0.35 + Math.sin(elapsed * 8) * 0.15);
	material.color.setHex(0x8a2f2f);
	for (let i = 0; i < positions.count; i += 1) {
		const ix = i * 3;
		positions.array[ix + 1] = 0.4 + Math.sin(elapsed * 10 + i) * 0.08;
	}
	positions.needsUpdate = true;
	return elapsed < 1.2;
}

/**
 * Soft parallax from pointer position.
 * @param {import('three').Camera} camera
 * @param {number} nx normalized -1..1
 * @param {number} ny normalized -1..1
 */
export function applyParallax(camera, nx, ny) {
	camera.position.x = nx * 0.45;
	camera.position.y = 8.5 + ny * 0.25;
	camera.lookAt(0, 0, 0);
}
