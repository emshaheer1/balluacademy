import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dir = path.join(root, 'public', 'Hero-img')
const outFile = path.join(root, 'src', 'data', 'heroImgPaths.js')

const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
  console.log('Created public/Hero-img — add images and run again.')
}

const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => exts.has(path.extname(f).toLowerCase())).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  : []

const lines = files.length ? files.map((f) => `  ${JSON.stringify(`Hero-img/${f}`)}`).join(',\n') : ''

const body = `import { publicEncodedAsset } from './products.js'

/**
 * Pixel size of \`public/hero-img.png\` — all slides share this aspect in CSS (\`aspect-ratio: 612 / 918\`).
 */
export const HERO_REFERENCE_WIDTH = 612
export const HERO_REFERENCE_HEIGHT = 918

/**
 * Files in \`public/Hero-img/\` (case-sensitive on many hosts).
 * Regenerate: \`npm run scan-hero-img\`
 */
export const HERO_SLIDESHOW_PATHS = [
${lines ? `${lines}\n` : ''}]

export function getHeroSlideshowUrls() {
  if (!HERO_SLIDESHOW_PATHS.length) {
    return [publicEncodedAsset('hero-img.png')]
  }
  return HERO_SLIDESHOW_PATHS.map((p) => publicEncodedAsset(p))
}
`

fs.writeFileSync(outFile, body, 'utf8')
console.log(`Hero-img: ${files.length} image(s) → src/data/heroImgPaths.js`)
