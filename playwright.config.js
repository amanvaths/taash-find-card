import { defineConfig, devices } from '@playwright/test';

const liveUrl = process.env.LIVE_URL;

export default defineConfig({
	...(liveUrl
		? {}
		: {
				webServer: {
					command: 'npm run build && npm run preview',
					port: 4173,
					reuseExistingServer: !process.env.CI
				}
			}),
	testDir: 'tests/e2e',
	testMatch: liveUrl ? '**/deployed-smoke.e2e.js' : '**/*.e2e.js',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: 'list',
	use: liveUrl
		? {
				baseURL: liveUrl
			}
		: {},
	projects: liveUrl
		? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
		: [
				{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
				{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
				{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
				{
					name: 'mobile-chrome',
					use: { ...devices['Pixel 7'] }
				}
			]
});
