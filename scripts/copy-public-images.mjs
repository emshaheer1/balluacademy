import { cpSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const src = join(root, 'public', 'Images')
const dest = join(distDir, 'Images')

if (!existsSync(distDir)) {
  console.warn('copy-public-images: dist/ not found (run vite build first). Skipping.')
  process.exit(0)
}
if (!existsSync(src)) {
  console.warn('copy-public-images: public/Images not found. Skipping.')
  process.exit(0)
}

cpSync(src, dest, { recursive: true })
console.log('copy-public-images: copied public/Images → dist/Images')
