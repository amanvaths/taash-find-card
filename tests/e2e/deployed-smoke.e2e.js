import { expect, test } from '@playwright/test';
import { cardId, parseCardId } from '../../src/lib/game/cards.js';
import { SUITS } from '../../src/lib/game/constants.js';
import { createRound } from '../../src/lib/game/round.js';

/**
 * Deployed-environment smoke suite.
 * Requires LIVE_URL (e.g. https://taash-find-card.pages.dev).
 * Seed query is ignored for normal production users; Playwright sets
 * navigator.webdriver=true so deterministic seed remains available to automation only.
 */

const LIVE_URL = process.env.LIVE_URL;
const SEED = 424242;

test.describe('deployed production smoke', () => {
	test.skip(!LIVE_URL, 'LIVE_URL not set — deployed smoke NOT RUN');

	test.beforeEach(async ({ page }) => {
		test.setTimeout(90_000);
		await page.goto(`${LIVE_URL}/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready', {
			timeout: 30_000
		});
	});

	test('initial 52-card board and target preview', async ({ page }) => {
		const errors = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		page.on('pageerror', (err) => errors.push(String(err)));

		await expect(page.getByTestId('card')).toHaveCount(52);
		await expect(page.getByTestId('suit-group')).toHaveCount(4);
		await expect(page.getByTestId('target-preview')).toBeVisible();
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-seed-active', '1');
		expect(errors).toEqual([]);
	});

	test('winning selection', async ({ page }) => {
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
	});

	test('losing selection and correct-card reveal', async ({ page }) => {
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		const { suit, rank } = parseCardId(round.targetCardId);
		const otherSuit = SUITS.find((s) => s !== suit);
		const wrong = cardId(/** @type {any} */ (otherSuit), rank);
		await page.locator(`[data-card-id="${wrong}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
		await expect(page.locator(`[data-card-id="${round.targetCardId}"]`)).toHaveClass(/is-revealed/);
	});

	test('New Round', async ({ page }) => {
		const before = await page.getByTestId('game-shell').getAttribute('data-round-id');
		await page.getByTestId('new-round').click();
		await expect(page.getByTestId('game-shell')).not.toHaveAttribute('data-round-id', before ?? '');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
	});

	test('mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`${LIVE_URL}/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		const box = await page.getByTestId('card').first().boundingBox();
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
	});

	test('reduced motion', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		await page.goto(`${LIVE_URL}/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
	});

	test('WebGL-disabled fallback', async ({ page }) => {
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		await page.goto(`${LIVE_URL}/?seed=${SEED}&motion=0&webgl=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-webgl', 'fallback');
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
	});

	test('direct URL reload', async ({ page }) => {
		await page.goto(`${LIVE_URL}/`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.reload();
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await expect(page.getByTestId('card')).toHaveCount(52);
	});

	test('favicon and static assets', async ({ page, request }) => {
		const base = LIVE_URL.replace(/\/$/, '');
		for (const path of ['/favicon.ico', '/textures/card-back.svg', '/_headers']) {
			// _headers may not be publicly fetchable as a document on CF; favicon + texture must be.
			if (path === '/_headers') continue;
			const res = await request.get(`${base}${path}`);
			expect(res.status(), path).toBe(200);
		}
		await page.goto(`${base}/`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
	});

	test('production users cannot use URL seed', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'webdriver', {
				configurable: true,
				get: () => false
			});
		});
		await page.goto(`${LIVE_URL}/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-seed-active', '0');
	});

	test('no browser console errors on happy path', async ({ page }) => {
		const errors = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		page.on('pageerror', (err) => errors.push(String(err)));
		const round = createRound({ seed: SEED, now: 1, roundId: 'probe' });
		await page.goto(`${LIVE_URL}/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
		expect(errors).toEqual([]);
	});
});
