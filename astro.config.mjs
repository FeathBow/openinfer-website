// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://openedinfer.com',
	integrations: [
		starlight({
			title: 'openinfer',
			logo: { src: './src/assets/logo.png' },
			favicon: '/favicon.png',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/openinfer-project/openinfer',
				},
			],
			sidebar: [
				{ label: 'Getting Started', slug: 'getting-started' },
				{
					label: 'Models',
					items: [{ label: 'Qwen3-4B', slug: 'models/qwen3-4b' }],
				},
			],
		}),
	],
});
