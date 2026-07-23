import { expect, test } from '@playwright/test';
import { cardId, parseCardId } from '../../src/lib/game/cards.js';
import { RANKS, SUITS } from '../../src/lib/game/constants.js';
import { createRound } from '../../src/lib/game/round.js';

const SEED = 424242;
const MOTION = 'motion=0';

/**
 * @param {number} seed
 */
function expectedRound(seed) {
	return createRound({ seed, now: 1, roundId: 'probe' });
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function gotoSeeded(page, extra = '') {
	const qs = `seed=${SEED}&${MOTION}${extra ? `&${extra}` : ''}`;
	await page.goto(`/?${qs}`);
	await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
	await expect(page.getByTestId('game-shell')).toHaveAttribute('data-seed-active', '1');
}

test.describe('Taash find-card game', () => {
	test('E01: exactly 52 hidden gameplay buttons', async ({ page }) => {
		const errors = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		page.on('pageerror', (err) => errors.push(String(err)));

		await gotoSeeded(page);
		const cards = page.getByTestId('card');
		await expect(cards).toHaveCount(52);
		for (const card of await cards.all()) {
			await expect(card).toHaveAttribute('type', 'button');
			await expect(card).not.toHaveClass(/is-revealed/);
		}
		expect(errors).toEqual([]);
	});

	test('E02: exactly four suit groups with 13 cards each', async ({ page }) => {
		await gotoSeeded(page);
		const groups = page.getByTestId('suit-group');
		await expect(groups).toHaveCount(4);
		for (const suit of SUITS) {
			const group = page.locator(`[data-testid="suit-group"][data-suit="${suit}"]`);
			await expect(group).toBeVisible();
			await expect(group.getByTestId('card')).toHaveCount(13);
		}
	});

	test('E03: target preview is visible, face-up, exposes rank and suit', async ({ page }) => {
		const round = expectedRound(SEED);
		const { suit, rank } = parseCardId(round.targetCardId);
		await gotoSeeded(page);
		const preview = page.getByTestId('target-preview');
		await expect(preview).toBeVisible();
		await expect(preview).toHaveAttribute('data-interactive', 'false');
		await expect(preview.locator('.target-preview__card')).toHaveAttribute('data-rank', rank);
		await expect(preview.locator('.target-preview__card')).toHaveAttribute('data-suit', suit);
		await expect(preview.getByText('Find this card')).toBeVisible();
	});

	test('E04: deterministic correct click wins', async ({ page }) => {
		const round = expectedRound(SEED);
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'won');
	});

	test('E05: deterministic wrong click loses', async ({ page }) => {
		const round = expectedRound(SEED);
		const wrong = round.groups.flatMap((g) => g.cardIds).find((id) => id !== round.targetCardId);
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${wrong}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'lost');
	});

	test('same rank but wrong suit loses', async ({ page }) => {
		const round = expectedRound(SEED);
		const { suit, rank } = parseCardId(round.targetCardId);
		const otherSuit = SUITS.find((s) => s !== suit);
		const wrong = cardId(/** @type {any} */ (otherSuit), rank);
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${wrong}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
	});

	test('same suit but wrong rank loses', async ({ page }) => {
		const round = expectedRound(SEED);
		const { suit, rank } = parseCardId(round.targetCardId);
		const otherRank = RANKS.find((r) => r !== rank);
		const wrong = cardId(suit, /** @type {any} */ (otherRank));
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${wrong}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
	});

	test('E06: rapid double click resolves only once', async ({ page }) => {
		const round = expectedRound(SEED);
		const wrong = round.groups.flatMap((g) => g.cardIds).find((id) => id !== round.targetCardId);
		await gotoSeeded(page);
		const locator = page.locator(`[data-card-id="${wrong}"]`);
		await locator.evaluate((el) => {
			el.click();
			el.click();
		});
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
		await expect(page.locator('[data-testid="card"].is-selected')).toHaveCount(1);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'lost');
	});

	test('E07: touch/click duplication resolves only once', async ({ page }) => {
		const round = expectedRound(SEED);
		const wrong = round.groups.flatMap((g) => g.cardIds).find((id) => id !== round.targetCardId);
		await gotoSeeded(page);
		const locator = page.locator(`[data-card-id="${wrong}"]`);
		// Simulate synthetic duplicate activation (touch + click) on the same control.
		await locator.evaluate((el) => {
			el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
			el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});
		await expect(page.getByTestId('result-heading')).toHaveText('Loser');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'lost');
		await expect(page.locator('[data-testid="card"].is-selected')).toHaveCount(1);
	});

	test('E08: correct card reveals after loss', async ({ page }) => {
		const round = expectedRound(SEED);
		const wrong = round.groups.flatMap((g) => g.cardIds).find((id) => id !== round.targetCardId);
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${wrong}"]`).click();
		await expect(page.locator(`[data-card-id="${wrong}"]`)).toHaveClass(/is-revealed/);
		await expect(page.locator(`[data-card-id="${round.targetCardId}"]`)).toHaveClass(/is-revealed/);
		await expect(page.locator(`[data-card-id="${round.targetCardId}"]`)).toHaveClass(/is-correct/);
	});

	test('E09: New Round changes the round ID', async ({ page }) => {
		await gotoSeeded(page);
		const before = await page.getByTestId('game-shell').getAttribute('data-round-id');
		await page.getByTestId('new-round').click();
		await expect(page.getByTestId('game-shell')).not.toHaveAttribute('data-round-id', before ?? '');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
	});

	test('E10: keyboard Enter selects focused card', async ({ page }) => {
		const round = expectedRound(SEED);
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${round.targetCardId}"]`).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
	});

	test('E11: aria-live announces result', async ({ page }) => {
		const round = expectedRound(SEED);
		await gotoSeeded(page);
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('aria-status')).toContainText(/Winner/i);
	});

	test('E12: target preview is noninteractive and cannot resolve round', async ({ page }) => {
		await gotoSeeded(page);
		const preview = page.getByTestId('target-preview');
		await expect(preview.locator('button')).toHaveCount(0);
		await expect(preview).toHaveAttribute('data-interactive', 'false');
		await expect(preview).toHaveCSS('pointer-events', 'none');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await expect(page.getByTestId('result-dialog')).toHaveCount(0);
	});

	test('E13: mobile portrait layout remains usable', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await gotoSeeded(page);
		const first = page.getByTestId('card').first();
		const box = await first.boundingBox();
		expect(box).not.toBeNull();
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
	});

	test('E14: sticky target preview does not cover final mobile cards', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await gotoSeeded(page);
		const clubs = page.locator('[data-testid="suit-group"][data-suit="clubs"]');
		const lastCard = clubs.getByTestId('card').last();
		await lastCard.scrollIntoViewIfNeeded();
		const cardBox = await lastCard.boundingBox();
		const previewBox = await page.getByTestId('target-preview').boundingBox();
		expect(cardBox).not.toBeNull();
		expect(previewBox).not.toBeNull();
		const overlaps =
			cardBox.x < previewBox.x + previewBox.width &&
			cardBox.x + cardBox.width > previewBox.x &&
			cardBox.y < previewBox.y + previewBox.height &&
			cardBox.y + cardBox.height > previewBox.y;
		expect(overlaps).toBe(false);
	});

	test('E15: reduced motion completes round', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const round = expectedRound(SEED);
		await page.goto(`/?seed=${SEED}&motion=0`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
	});

	test('E16: WebGL initialization failure leaves the game playable', async ({ page }) => {
		const round = expectedRound(SEED);
		await gotoSeeded(page, 'webgl=0');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-webgl', 'fallback');
		await page.locator(`[data-card-id="${round.targetCardId}"]`).click();
		await expect(page.getByTestId('result-heading')).toHaveText('Winner');
	});

	test('E17: teardown path emits no console errors', async ({ page }) => {
		const errors = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		page.on('pageerror', (err) => errors.push(String(err)));
		await gotoSeeded(page, 'webgl=0');
		await page.getByTestId('new-round').click();
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await page.goto('/?motion=0&webgl=0');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		expect(errors).toEqual([]);
	});

	test('E18: production route loads directly without seed', async ({ page }) => {
		const errors = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		page.on('pageerror', (err) => errors.push(String(err)));
		await page.goto('/');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await expect(page.getByTestId('card')).toHaveCount(52);
		await expect(page.getByTestId('target-preview')).toBeVisible();
		expect(errors).toEqual([]);
	});

	test('production users cannot activate URL seed without automation', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'webdriver', {
				configurable: true,
				get: () => false
			});
		});
		await page.goto(`/?seed=${SEED}&${MOTION}`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-seed-active', '0');
	});

	test('favicon.ico loads without 404', async ({ page, request }) => {
		const res = await request.get('/favicon.ico');
		expect(res.status()).toBe(200);
		await page.goto(`/?seed=${SEED}&${MOTION}`);
		await expect(page.getByTestId('game-shell')).toHaveAttribute('data-phase', 'ready');
	});

	test('mute toggle is available and persists pressed state', async ({ page }) => {
		await gotoSeeded(page);
		const mute = page.getByTestId('mute-toggle');
		await mute.click();
		await expect(mute).toHaveAttribute('aria-pressed', 'true');
		await mute.click();
		await expect(mute).toHaveAttribute('aria-pressed', 'false');
	});
});
