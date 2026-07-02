import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { DIST_PAGES, SITE_ROUTES } from './routes.mjs';

const distDir = join(import.meta.dirname, '..', 'dist');

describe('static build output', () => {
	for (const page of DIST_PAGES) {
		it(`dist/${page} exists`, () => {
			assert.ok(existsSync(join(distDir, page)), `missing dist/${page}`);
		});
	}

	it('sitemap lists every expected route', () => {
		const sitemap = readFileSync(join(distDir, 'sitemap-0.xml'), 'utf8');
		for (const route of SITE_ROUTES) {
			const loc = `https://open-infer.org${route === '/' ? '/' : route}`;
			assert.match(sitemap, new RegExp(`<loc>${loc}</loc>`), `sitemap missing ${loc}`);
		}
	});

	it('404 page is Starlight styled, not a bare error', () => {
		const html = readFileSync(join(distDir, '404.html'), 'utf8');
		assert.match(html, /Page not found/i);
		assert.match(html, /starlight|openinfer/i);
	});
});
