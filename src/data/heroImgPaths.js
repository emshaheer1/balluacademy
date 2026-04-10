import { publicEncodedAsset } from './products.js'

/**
 * Pixel size of `public/hero-img.png` — all slides share this aspect in CSS (`aspect-ratio: 612 / 918`).
 */
export const HERO_REFERENCE_WIDTH = 612
export const HERO_REFERENCE_HEIGHT = 918

/**
 * Files in `public/Hero-img/` (case-sensitive on many hosts).
 * Regenerate: `npm run scan-hero-img`
 */
export const HERO_SLIDESHOW_PATHS = [
  'Hero-img/army green t shirt male.png',
  'Hero-img/croppedshirt female.png',
  'Hero-img/full shirt female.png',
  'Hero-img/hero-img.png',
  'Hero-img/hoodie male.png',
  'Hero-img/hoodie shorts female.png',
]

export function getHeroSlideshowUrls() {
  if (!HERO_SLIDESHOW_PATHS.length) {
    return [publicEncodedAsset('hero-img.png')]
  }
  return HERO_SLIDESHOW_PATHS.map((p) => publicEncodedAsset(p))
}
