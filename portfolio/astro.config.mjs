import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set `site` to the production URL before deploying: canonical, OG and sitemap depend on it.
export default defineConfig({
  site: 'https://chasecarr.com',
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
