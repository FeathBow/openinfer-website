// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://open-infer.org';
// TODO(seo): replace with a dedicated 1200x630 social card at /og-card.png.
// favicon.png is square and renders small in link previews — fine as an interim.
const OG_IMAGE = `${SITE}/favicon.png`;

// https://astro.build/config
export default defineConfig({
	site: SITE,
	integrations: [
		sitemap(),
		starlight({
			title: 'openinfer',
			logo: { src: './src/assets/logo.png' },
			favicon: '/favicon.png',
			customCss: ['./src/styles/custom.css'],
			// Starlight already emits <title>, description, og:title/description/url,
			// canonical, and twitter:card=summary_large_image. These fill the gaps:
			// a social preview image and SoftwareApplication structured data.
			head: [
				{ tag: 'meta', attrs: { property: 'og:image', content: OG_IMAGE } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: OG_IMAGE } },
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'SoftwareApplication',
						name: 'openinfer',
						description:
							'Pure Rust + CUDA LLM inference engine — no PyTorch, OpenAI-compatible, serves Qwen3 to Kimi-K2.',
						url: SITE,
						applicationCategory: 'DeveloperApplication',
						operatingSystem: 'Linux, Windows',
						programmingLanguage: ['Rust', 'CUDA'],
						codeRepository: 'https://github.com/openinfer-project/openinfer',
						license: 'https://www.apache.org/licenses/LICENSE-2.0',
						offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
					}),
				},
			],
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
					label: 'Blogs',
					items: [
						{ label: 'All Posts', slug: 'blog' },
						{
							label: 'OpenInfer 0.1.0: Production-Grade Rust Inference',
							slug: 'blog/openinfer-010',
						},
					],
				},
				{
					label: 'Models',
					items: [{ label: 'Qwen3-4B', slug: 'models/qwen3-4b' }],
				},
			],
		}),
	],
});
