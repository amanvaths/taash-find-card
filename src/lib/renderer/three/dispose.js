/**
 * Dispose Three.js resources and detach the canvas.
 * Safe to call multiple times / after context loss.
 * @param {{
 *   renderer?: import('three').WebGLRenderer | null,
 *   scene?: import('three').Scene | null,
 *   particles?: import('three').Points | null,
 *   table?: import('three').Mesh | null,
 *   onContextLost?: ((event: Event) => void) | null
 * }} resources
 */
export function disposeScene(resources) {
	const { renderer, scene, particles, table, onContextLost } = resources;

	if (renderer?.domElement && onContextLost) {
		renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
	}

	const disposed = new Set();

	/**
	 * @param {import('three').BufferGeometry | import('three').Material | import('three').Texture | null | undefined} item
	 */
	function disposeOnce(item) {
		if (!item || disposed.has(item)) return;
		disposed.add(item);
		if ('dispose' in item && typeof item.dispose === 'function') {
			item.dispose();
		}
	}

	/**
	 * @param {import('three').Material | import('three').Material[]} material
	 */
	function disposeMaterial(material) {
		const list = Array.isArray(material) ? material : [material];
		for (const mat of list) {
			if (!mat) continue;
			for (const value of Object.values(mat)) {
				if (value && typeof value === 'object' && 'isTexture' in value) {
					disposeOnce(/** @type {import('three').Texture} */ (value));
				}
			}
			disposeOnce(mat);
		}
	}

	if (particles) {
		disposeOnce(particles.geometry);
		disposeMaterial(/** @type {import('three').Material} */ (particles.material));
	}

	if (table) {
		disposeOnce(table.geometry);
		disposeMaterial(/** @type {import('three').Material} */ (table.material));
	}

	if (scene) {
		scene.traverse((object) => {
			if ('geometry' in object && object.geometry) {
				disposeOnce(/** @type {import('three').BufferGeometry} */ (object.geometry));
			}
			if ('material' in object && object.material) {
				disposeMaterial(
					/** @type {import('three').Material | import('three').Material[]} */ (object.material)
				);
			}
		});
		while (scene.children.length > 0) {
			scene.remove(scene.children[0]);
		}
	}

	if (renderer) {
		try {
			renderer.dispose();
		} catch {
			/* context may already be lost */
		}
		try {
			renderer.forceContextLoss?.();
		} catch {
			/* ignore */
		}
		const canvas = renderer.domElement;
		if (canvas?.parentElement) {
			canvas.parentElement.removeChild(canvas);
		}
	}
}
