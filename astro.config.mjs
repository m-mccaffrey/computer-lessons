// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

// TODO(human): confirm the GitHub user and repo name. These drive the base path,
// and getting them wrong breaks every asset URL in production. See DECISIONS.md #1.
const SITE = 'https://m-mccaffrey.github.io'
const BASE = '/computer-lessons/'

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  build: {
    // One directory per route, so /lessons/01/ serves index.html on GitHub Pages.
    format: 'directory',
  },
  vite: {
    build: {
      // The Pi 400 budget. Keep chunks small and legible rather than clever.
      target: 'es2020',
    },
  },
})
