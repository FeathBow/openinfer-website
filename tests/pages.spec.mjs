import { expect, test } from '@playwright/test';
import { SITE_ROUTES } from './routes.mjs';

for (const path of SITE_ROUTES) {
	test(`${path} returns 200 and is not the 404 page`, async ({ page }) => {
		const response = await page.goto(path);
		expect(response?.status(), `HTTP status for ${path}`).toBe(200);
		await expect(page.locator('body')).not.toContainText('Page not found. Check the URL');
		await expect(page.locator('h1#_top, h1').first()).toBeVisible();
	});
}

test('unknown paths show the 404 page', async ({ page }) => {
	const response = await page.goto('/this-page-does-not-exist/');
	expect(response?.status()).toBe(404);
	await expect(page.locator('body')).toContainText('Page not found');
});

test('sidebar Getting Started link resolves', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Getting Started', exact: true }).click();
	await expect(page).toHaveURL(/\/getting-started\/$/);
	await expect(page.locator('h1')).toContainText('Getting Started');
});
