import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const buildDir = join(process.cwd(), 'build');
const headerFile = join(buildDir, '_headers');

/**
 * Extract sha256 CSP hashes for inline <script> bodies in built HTML.
 * Required because SvelteKit emits a small inline bootstrap script.
 */
function collectHashes() {
	/** @type {Set<string>} */
	const hashes = new Set();
	for (const name of ['index.html', '200.html']) {
		const file = join(buildDir, name);
		if (!existsSync(file)) continue;
		const html = readFileSync(file, 'utf8');
		const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
		let match;
		while ((match = re.exec(html))) {
			const content = match[1];
			if (!content.trim()) continue;
			const digest = createHash('sha256').update(content, 'utf8').digest('base64');
			hashes.add(`'sha256-${digest}'`);
		}
	}
	return [...hashes];
}

function buildCsp(scriptHashes) {
	const scriptSrc = ["'self'", ...scriptHashes].join(' ');
	return [
		"default-src 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"object-src 'none'",
		`script-src ${scriptSrc}`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		"connect-src 'self'",
		"worker-src 'self' blob:",
		"media-src 'none'",
		'upgrade-insecure-requests'
	].join('; ');
}

if (!existsSync(headerFile)) {
	console.error('build/_headers missing — run vite build first');
	process.exit(1);
}

const hashes = collectHashes();
if (hashes.length === 0) {
	console.warn('No inline scripts found; leaving CSP script-src as self-only');
}

const csp = buildCsp(hashes);
const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=(), interest-cohort=()
  Content-Security-Policy: ${csp}
`;

writeFileSync(headerFile, headers);
console.log(`Updated CSP with ${hashes.length} inline script hash(es): ${hashes.join(' ')}`);
