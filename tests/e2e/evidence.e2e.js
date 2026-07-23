import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRound } from '../../src/lib/game/round.js';

const SEED = 424242;
const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(__dirname, '../../docs/evidence');

mkdirSync(evidenceDir, { recursive: true });

const VIEWPORTS = [
	{ name: '320x568', width: 320, height: 568 },
	{ name: '375x667', width: 375, height: 667 },
	{ name: '390x844', width: 390, height: 844 },
	{ name: '768x1024', width: 768, height: 1024 },
	{ name: '1280x720', width: 1280, height: 720 },
	{ name: '1440x900', width: 1440, height: 900 }
];

test.describe('viewport + evidence capture', () => {
	test.describe.configure({ mode: 'serial' });

	for (const vp of VIEWPORTS) {
		test(`viewport ${vp.name} loads playable board`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.goto(`/?seed=${SEED}&motion=0`);
			await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
			await expect(page.getByTestId('card')).toHaveCount(52);
			await page.screenshot({
				path: join(evidenceDir, `viewport-${vp.name}.png`),
				fullPage: true
			});
		});
	}

	test('capture initial board', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto(`/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.screenshot({ path: join(evidenceDir, 'initial-board.png'), fullPage: true });
	});

	test('capture winning selection', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto(`/?seed=${SEED}&motion=0`);
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
		await page.screenshot({ path: join(evidenceDir, 'winning-selection.png'), fullPage: true });
	});

	test('capture losing selection with correct reveal', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		const wrong = round.groups.flatMap((g) => g.cardIds).find((id) => id !== round.targetCardId);
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto(`/?seed=${SEED}&motion=0`);
		await page.locator(`[data-card-id="${wrong}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
		await expect(page.locator(`[data-card-id="${round.targetCardId}"]`)).toHaveClass(/is-revealed/);
		await page.screenshot({
			path: join(evidenceDir, 'losing-selection-reveal.png'),
			fullPage: true
		});
	});

	test('capture mobile portrait', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.screenshot({ path: join(evidenceDir, 'mobile-portrait.png'), fullPage: true });
	});

	test('capture reduced-motion mode', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto(`/?seed=${SEED}&motion=0`);
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
		await page.screenshot({ path: join(evidenceDir, 'reduced-motion.png'), fullPage: true });
	});

	test('capture WebGL-disabled fallback', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'Evidence captured once on Chromium');
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto(`/?seed=${SEED}&motion=0&webgl=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-webgl', 'fallback');
		await page.screenshot({ path: join(evidenceDir, 'webgl-fallback.png'), fullPage: true });
	});
});
