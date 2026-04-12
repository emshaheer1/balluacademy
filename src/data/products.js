import { STORE_CATALOG_PATHS } from './storeCatalogPaths.js'

export const MENS_SUBCATEGORIES = ['U Hoodies', 'Logo Branded Hoodies', 'Shorts', 'T-Shirts']
export const WOMENS_SUBCATEGORIES = ['U Hoodies', 'Logo Branded Hoodies', 'Shorts', 'T-Shirts', 'Crop Top T-Shirts']

/** Files in `public/` — works with Vite `base` and avoids broken URLs when folder/file names contain spaces. */
export function publicAsset(relPath) {
  const base = import.meta.env.BASE_URL || '/'
  const path = String(relPath || '').replace(/^\/+/, '')

  // When Vite base is set to './', runtime string URLs like './Images/...' become
  // relative to the current route (e.g. /products/Images/...), which breaks.
  // For public assets we want them rooted.
  const baseClean = base === './' ? '/' : base
  if (baseClean === '/' || baseClean === '') return `/${path}`
  if (baseClean.endsWith('/')) return `${baseClean}${path}`
  return `${baseClean}/${path}`
}

function splitPath(p) {
  return String(p || '').replace(/\\/g, '/').split('/').filter(Boolean)
}

/** Public URL with each path segment encoded (spaces/special chars in filenames). */
export function publicEncodedAsset(relPath) {
  const norm = String(relPath || '').replace(/\\/g, '/').replace(/^\/+/, '')
  const encoded = splitPath(norm).map(encodeURIComponent).join('/')
  return publicAsset(encoded)
}

/** `manifest.json` entry like `Mens logo hoodie/Black hungary.png` → encoded URL under `/Images/`. */
export function productImageUrl(relativePath) {
  const encoded = splitPath(relativePath).map(encodeURIComponent).join('/')
  return publicAsset(`Images/${encoded}`)
}

/** Any file under `public/` (e.g. `Mens Stuff/.../file.png`). */
export function catalogPublicUrl(relPath) {
  const norm = String(relPath || '').replace(/\\/g, '/')
  const encoded = splitPath(norm).map(encodeURIComponent).join('/')
  return publicAsset(encoded)
}

function slugifyPathSegment(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96) || 'item'
}

/** shorts | crop | tshirts | hoodies — used for pricing + filters; id must include keyword for Stripe. */
export function inferStoreProductType(relPath) {
  const lower = String(relPath || '').toLowerCase()
  if (lower.includes('crop')) return 'crop'
  if (lower.includes('short')) return 'shorts'
  if (lower.includes('hoodie') || lower.includes('hoodies')) return 'hoodies'
  if (lower.includes('shirt') || lower.includes('tshirt') || lower.includes('tee')) return 'tshirts'
  return 'hoodies'
}

export const IMAGES_MANIFEST_URL = publicAsset('Images/manifest.json')

// Safe fallback if a product image fails to load.
export const FALLBACK_IMG = publicAsset('logo.png')

// Used only if `public/Images/manifest.json` can't load for some reason.
export const DEFAULT_IMAGE_FILENAMES = [
  'Mens logo hoodie/Black hungary.png',
  'Mens logo hoodie/Bundary.png',
  'Mens logo hoodie/CHocolate Brown.png',
  'Mens logo hoodie/LightGrey.png',
  'Mens logo hoodie/Navy Blue.png',
  'Mens logo hoodie/Red hoodie on court.png',
  'Mens printed hoodie/black with white.jpg',
  'Mens printed hoodie/red with black and white small logos.png',
  'Mens printed hoodie/white with royal blue.jpg',
  'Mens shorts/Black and WHite Male SHorts.png',
  'Mens shorts/Red with White male shorts.png',
  'Mens shorts/white and blue male shorts.png',
  'Mens t-shirt/army green u ball.png',
  'Mens t-shirt/black u ball.png',
  'Mens t-shirt/burgandy u ball.png',
  'Mens t-shirt/red hungry.png',
  'Mens t-shirt/royal blue hungry.png',
  'Mens t-shirt/tan hungry.png',
  'Womens crop t-shirt/crop lavender.png',
  'Womens crop t-shirt/crop light pink.png',
  'Womens crop t-shirt/crop yellow.png',
  'womens shorts/Black and White Female SHorts.png',
  'womens shorts/Red Female short.png',
  'womens shorts/White and Royal Blue Female Shorts blue strips.png',
  'Womens t-shirt/Light grey.png',
  'Womens t-shirt/light pink.png',
  'Womens t-shirt/tan.png',
]

function stripExtension(filename) {
  return (filename || '').replace(/\.[^.]+$/, '').trim()
}

function titleize(input) {
  const cleaned = String(input || '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .map((w) => {
      if (!w.length) return w
      const lower = w.toLowerCase()
      return lower[0].toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function getGenderFromName(lower) {
  if (lower.includes('female') || lower.includes('womens') || lower.includes('women')) return 'womens'
  if (lower.includes('male') || lower.includes('mens') || lower.includes('men')) return 'mens'
  return null
}

function classifyType(filename) {
  const parts = splitPath(filename)
  const folder = (parts[0] || '').toLowerCase()
  const lower = String(filename || '').toLowerCase()

  // Prefer folder-based classification now that images are organized.
  if (folder.includes('crop')) return 'crop'
  if (folder.includes('short')) return 'shorts'
  if (folder.includes('t-shirt') || folder.includes('tshirt') || folder.includes('tee')) return 'tshirts'
  if (folder.includes('hoodie')) return 'hoodies'

  if (lower.includes('crop')) return 'crop'
  if (lower.includes('short')) return 'shorts'
  // “with ...”, “logos” usually correspond to tees in your filenames.
  if (lower.includes('with') || lower.includes('logos') || lower.includes('logo') || lower.includes('tee')) return 'tshirts'
  if (
    lower.includes('hoodie')
    || lower.includes('hungry')
    || lower.includes('hungary')
    || lower.includes('u ball')
    || lower.includes('bundary')
    || lower.includes('ball')
  ) {
    return 'hoodies'
  }
  // Default: treat remaining images as hoodies.
  return 'hoodies'
}

function getHoodieSubcategory(lower) {
  const parts = splitPath(lower)
  const folder = (parts[0] || '').toLowerCase()
  if (folder.includes('logo hoodie')) return 'Logo Branded Hoodies'
  if (folder.includes('printed hoodie')) return 'U Hoodies'

  // Fallback.
  if (lower.includes('hoodie') || lower.includes('logo') || lower.includes('court')) return 'Logo Branded Hoodies'
  return 'U Hoodies'
}

function extractColor(lower, rawBase) {
  if (lower.includes('black') && lower.includes('white')) return 'Black & White'
  if (lower.includes('red') && lower.includes('black')) return 'Red & Black'
  if (lower.includes('white') && (lower.includes('blue') || lower.includes('royal') || lower.includes('navy'))) return 'White & Blue'
  if (lower.includes('army green')) return 'Army Green'
  if (lower.includes('royal blue')) return 'Royal Blue'
  if (lower.includes('navy blue')) return 'Navy Blue'
  if (lower.includes('light pink')) return 'Light Pink'
  if (lower.includes('light blue')) return 'Light Blue'
  if (lower.includes('cyan')) return 'Cyan'
  if (lower.includes('light grey') || lower.includes('lightgrey') || lower.includes('light gray') || lower.includes('lightgrey')) return 'Light Grey'
  if (lower.includes('lavendar') || lower.includes('lavender')) return 'Lavender'
  if (lower.includes('tourquoise')) return 'Turquoise'
  if (lower.includes('tourquise') || lower.includes('torquise') || lower.includes('turquoise')) return 'Turquoise'
  if (lower.includes('chocolate brown')) return 'Chocolate Brown'
  if (lower.includes('burgandy') || lower.includes('burgundy')) return 'Burgandy'
  if (lower.includes('yellow')) return 'Yellow'
  if (lower.includes('tan')) return 'Tan'
  if (lower.includes('olive')) return 'Olive'
  if (lower.includes('red')) return 'Red'
  if (lower.includes('blue')) return 'Blue'
  if (lower.includes('black')) return 'Black'
  if (lower.includes('white')) return 'White'
  if (lower.includes('grey') || lower.includes('gray')) return 'Grey'

  // Fallback: use a prettified version of the filename base.
  return titleize(rawBase)
}

function pickSize(gender, i) {
  if (gender === 'mens') return ['M', 'L', 'XL'][i % 3]
  if (gender === 'womens') return ['XS', 'S', 'M'][i % 3]
  return 'M'
}

function buildProduct({ id, filename, gender, type, subcategory, category, i }) {
  const lower = String(filename).toLowerCase()
  const rawBase = stripExtension(filename)
  const color = extractColor(lower, rawBase)

  const common = {
    id,
    gender,
    category,
    subcategory,
    image: productImageUrl(filename),
    color,
  }

  if (type === 'shorts') {
    return {
      ...common,
      name: `${color} Shorts`,
      description: `Built for movement with a comfortable, game-day feel.`,
      price: 44.99,
      size: pickSize(gender, i),
      material: 'Polyester',
      fit: 'Athletic',
    }
  }

  if (type === 'crop') {
    return {
      ...common,
      name: `${color} Crop Tee`,
      description: `A confident crop designed for everyday comfort and bold style.`,
      price: 27.99,
      size: pickSize(gender, i),
      material: 'Cotton',
      fit: 'Cropped',
    }
  }

  if (type === 'tshirts') {
    return {
      ...common,
      name: `${color} T-Shirt`,
      description: `Premium everyday tee with comfort you can count on.`,
      price: 29.99,
      size: pickSize(gender, i),
      material: 'Cotton',
      fit: 'Regular',
    }
  }

  // hoodies
  return {
    ...common,
    name: subcategory === 'Logo Branded Hoodies' ? `${color} Logo Hoodie` : `${color} U Hoodie`,
    description: `Premium hoodie with bold style and everyday comfort.`,
    price: 59.99,
    size: pickSize(gender, i),
    material: 'Cotton blend',
    fit: 'Regular',
  }
}

function truncateToWords(text, maxWords) {
  const w = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return w.slice(0, maxWords).join(' ')
}

function storeTypeWord(storeType) {
  if (storeType === 'shorts') return 'Shorts'
  if (storeType === 'crop') return 'Crop'
  if (storeType === 'tshirts') return 'Tee'
  return 'Hoodie'
}

/** Up to 3 words: color (max 2) + product type. */
function buildShortProductTitle(color, storeType) {
  const typeW = storeTypeWord(storeType)
  const colorWords = String(color || 'Classic').trim().split(/\s+/).filter(Boolean).slice(0, 2)
  const combined = [...colorWords, typeW]
  return truncateToWords(combined.join(' '), 3)
}

/** Ball U Shirt + women’s HU Hungry tees: `{Color} Tee` — avoids `Black & Tee` when `extractColor` is compound. */
function ballUShirtTeeTitleFromColor(color) {
  let c = String(color || 'Classic').trim()
  if (c.includes('&')) c = c.split('&')[0].trim()
  return `${titleize(c)} Tee`
}

/** U Not Crop (Black / White edition): `{Color} Crop` — avoids `Black & Crop` / `White & Crop` from path noise. */
function uNotCropLineCropTitleFromColor(color) {
  let c = String(color || 'Classic').trim()
  if (c.includes('&')) c = c.split('&')[0].trim()
  return `${titleize(c)} Crop`
}

/** U graphic / accent phrase for titles, from filename segment after "with". */
function formatPatternUUEditionPhrase(phrase) {
  const l = String(phrase || '').toLowerCase().trim()
  if (!l) return ''
  if (l.includes('black') && l.includes('white')) return 'White & Black'
  if (l.includes('purple') && l.includes('royal blue')) return 'Purple & Royal Blue'
  if (/\s+and\s+/i.test(phrase)) {
    return phrase
      .split(/\s+and\s+/i)
      .map((chunk) => titleize(chunk.trim()))
      .filter(Boolean)
      .join(' & ')
  }
  return titleize(phrase.trim())
}

/**
 * Distinct names for `Pattern U hoodies` from files like `Red with Black U.png`,
 * `black with white.jpg`, `red with black and white small logos.png`.
 */
function buildPatternUHoodieProductName(filename) {
  const raw = stripExtension(String(filename || '')).replace(/_/g, ' ')
  if (!raw.trim()) return null
  const hasSmallLogos = /\bsmall\s*logos?\b/i.test(raw)
  let work = raw.replace(/\bsmall\s*logos?\b/gi, ' ').replace(/\s+/g, ' ').trim()

  const withMatch = work.match(/^(.+?)\s+with\s+(.+)$/i)
  if (!withMatch) {
    const fallback = titleize(work)
    if (!fallback) return null
    return hasSmallLogos ? `${fallback} Hoodie (Small Logos U Edition)` : `${fallback} Hoodie (U Edition)`
  }

  const bodyTitle = titleize(withMatch[1].trim())
  let afterWith = withMatch[2].trim().replace(/\s+u\s*$/i, '').trim()
  const editionCore = formatPatternUUEditionPhrase(afterWith)

  let editionLabel = editionCore
  if (hasSmallLogos) {
    editionLabel = editionCore ? `${editionCore} Small Logos` : 'Small Logos'
  }

  if (!editionLabel) return `${bodyTitle} Hoodie (U Edition)`
  return `${bodyTitle} Hoodie (${editionLabel} U Edition)`
}

function stripTrailingShortsNoise(s) {
  let t = String(s || '').trim()
  const re = /\s+(male|female)\s+(shorts?|sh)\s*$/i
  while (re.test(t)) t = t.replace(re, '').trim()
  t = t.replace(/\s+shorts?\s*$/i, '').trim()
  t = t.replace(/\s+short\s*$/i, '').trim()
  return t
}

/** Strip gender/garment tokens so U Shorts Yoga titles read as colors only (e.g. no “Female Short” in edition). */
function sanitizeShortsColorPhrase(s) {
  return String(s || '')
    .replace(/\b(female|male|shorts?|sh)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractShortsFilenameTags(raw) {
  let t = String(raw || '').trim()
  let bigLogo = false
  let blueStrips = false
  if (/^\s*big\s*logo\s+/i.test(t)) {
    bigLogo = true
    t = t.replace(/^\s*big\s*logo\s+/i, '').trim()
  }
  if (/\bblue\s*strips?\b/i.test(t)) {
    blueStrips = true
    t = t.replace(/\bblue\s*strips?\b/gi, ' ').replace(/\s+/g, ' ').trim()
  }
  t = stripTrailingShortsNoise(t)
  return { work: t, bigLogo, blueStrips }
}

function mergeShortsEditionCoreAndTags(editionCore, opts) {
  const bits = []
  if (editionCore) bits.push(editionCore)
  if (opts.bigLogo) bits.push('Big logo')
  if (opts.blueStrips) bits.push('Blue strips')
  return bits.join(' — ')
}

function finalizeUniqueShortsTitle(bodyLabel, editionCore, opts) {
  const inner = mergeShortsEditionCoreAndTags(editionCore, opts)
  if (!inner) return `${bodyLabel} Shorts (U Edition)`
  return `${bodyLabel} Shorts (${inner} U Edition)`
}

/**
 * U Shorts / U Shorts Yoga: `{Body} Shorts ({accent} U Edition)` — body = main short color,
 * edition = U / trim colors (same idea as Pattern U hoodies). E.g. Red Shorts (White U Edition).
 */
function buildUShortsProductName(filename) {
  const raw0 = stripExtension(String(filename || '')).replace(/_/g, ' ')
  if (!raw0.trim()) return null
  const { work: w0, bigLogo, blueStrips } = extractShortsFilenameTags(raw0)
  const opts = { bigLogo, blueStrips }
  let work = sanitizeShortsColorPhrase(w0.replace(/\s+/g, ' ').trim())

  const withMatch = work.match(/^(.+?)\s+with\s+(.+)$/i)
  if (withMatch) {
    const bodyTitle = titleize(sanitizeShortsColorPhrase(withMatch[1].trim()))
    let after = sanitizeShortsColorPhrase(stripTrailingShortsNoise(withMatch[2].trim()))
    const hasDots = /\bdots?\b/i.test(after)
    after = after.replace(/\bdots?\b/gi, ' ').replace(/\s+/g, ' ').trim()
    let edition = formatPatternUUEditionPhrase(after)
    if (hasDots) edition = edition ? `${edition} Dots` : 'Dots'
    return finalizeUniqueShortsTitle(bodyTitle, edition, opts)
  }

  work = sanitizeShortsColorPhrase(stripTrailingShortsNoise(work))

  if (/black\s+and\s+white\s+red\b/i.test(work)) {
    return finalizeUniqueShortsTitle('Black', 'White & Red', opts)
  }

  const lw = work.toLowerCase()
  if (lw.includes('white') && lw.includes('royal blue')) {
    const parts = work.split(/\s+and\s+/i).map((x) => x.trim().toLowerCase())
    if (parts.length === 2 && parts.some((p) => p.includes('white')) && parts.some((p) => p.includes('royal blue'))) {
      return finalizeUniqueShortsTitle('White', 'Royal Blue & Purple', opts)
    }
  }

  if (lw.includes('white') && lw.includes('purple') && lw.includes('royal blue')) {
    return finalizeUniqueShortsTitle('White', 'Purple & Royal Blue', opts)
  }

  const andParts = work
    .split(/\s+and\s+/i)
    .map((p) => sanitizeShortsColorPhrase(p.trim()))
    .filter(Boolean)
  if (andParts.length === 2) {
    const a = andParts[0].toLowerCase()
    const b = andParts[1].toLowerCase()
    if (a.includes('black') && b.includes('white') && !a.includes('red') && !b.includes('red')) {
      return finalizeUniqueShortsTitle('Black', 'White', opts)
    }
    if (a.includes('white') && b.includes('black') && !a.includes('red') && !b.includes('red')) {
      return finalizeUniqueShortsTitle('White', 'Black', opts)
    }
    const bodyT = titleize(andParts[0])
    const editionT = formatPatternUUEditionPhrase(andParts[1]) || titleize(andParts[1])
    return finalizeUniqueShortsTitle(bodyT, editionT, opts)
  }

  if (andParts.length >= 3) {
    const bodyT = titleize(andParts[0])
    const rest = andParts.slice(1).join(' and ')
    const editionT = formatPatternUUEditionPhrase(rest) || titleize(rest)
    return finalizeUniqueShortsTitle(bodyT, editionT, opts)
  }

  const single = titleize(sanitizeShortsColorPhrase(work) || work)
  return finalizeUniqueShortsTitle(single || 'Classic', '', opts)
}

/** U Shorts (mens) — fixed display titles for specific SKUs only. */
function applyUShortsMensProductTitleOverrides(filename, computedTitle) {
  const bn = stripExtension(String(filename || '')).toLowerCase()
  if (/black\s+and\s+red\b/i.test(bn) && /\bmale\b/i.test(bn)) {
    return 'Red Shorts (Black U Edition)'
  }
  if (/black\s+and\s+white\s+red\b/i.test(bn)) {
    return 'Red Shorts (White & Black U Edition)'
  }
  return computedTitle
}

/** U Shorts Yoga — fixed display titles for specific filenames (white-base shorts). */
function applyUShortsYogaProductTitleOverrides(filename, computedTitle) {
  const bn = stripExtension(String(filename || '')).toLowerCase()
  if (bn.includes('purple and royal blue')) return 'White Shorts (Purple & Royal Blue U Edition)'
  if (bn.includes('purple and white') && !bn.includes('royal blue')) return 'White Shorts (Purple U Edition)'
  if (/\bred\s+female\s+short\b/i.test(bn)) return 'Red Shorts (White U Edition)'
  if (bn.includes('red with black and white dots')) return 'Red Shorts (White & Black U Edition)'
  if (bn.includes('white and royal blue') && bn.includes('blue strips')) {
    return 'White Shorts (Royal Blue— Blue strips U Edition)'
  }
  if (bn.includes('white and royal blue')) return 'White Shorts (Royal Blue U Edition)'
  return computedTitle
}

function normalizeFolderSegment(seg) {
  return String(seg || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Short label for one folder name (TOC + section headings). */
function compactFolderLabel(seg, maxWords) {
  let s = normalizeFolderSegment(seg)
  s = s.replace(/^mens\s+/i, '').replace(/^womens\s+/i, '').trim()
  const words = s.split(/\s+/).filter(Boolean)
  const drop = new Set(['logo', 'collection', 'the', 'and'])
  const cleaned = words.filter((w) => !drop.has(w.replace(/[^a-z']/gi, '').toLowerCase()))
  const use = cleaned.length >= 2 ? cleaned : words
  return truncateToWords(titleize(use.join(' ')), maxWords)
}

/** Professional short collection name for nav and section titles. */
function buildSectionTitleShort(parts) {
  const segs = parts.slice(1, -1)
  if (!segs.length) return 'Shop'
  const leaf = compactFolderLabel(segs[segs.length - 1], 4)
  if (segs.length === 1) return leaf
  const parent = compactFolderLabel(segs[segs.length - 2], 2)
  const combined = `${parent} · ${leaf}`
  if (combined.length <= 36) return combined
  return leaf
}

/**
 * Customer-facing collection titles (paths stay as on disk for image URLs).
 * Covers: U Hoodies, Ball U Hoodies, U Shorts, U Shorts Yoga, HU shirt/Hoodies, Ball U Shirt, U Not Crop/Tees when paths match.
 */
function displayNamesForSectionPath(sectionPath) {
  const norm = String(sectionPath || '').replace(/\\/g, '/')
  const l = norm.toLowerCase()
  if (!l) return null

  if (l.includes('u not ready') || l.includes('u-not-ready')) {
    if (l.includes('crop')) {
      return { sectionTitleShort: 'U Not Crop', sectionTitle: 'U Not Crop' }
    }
    return { sectionTitleShort: 'U Not Tees', sectionTitle: 'U Not Tees' }
  }
  if (l.includes('pattern u hoodies')) {
    return { sectionTitleShort: 'U Hoodies', sectionTitle: 'U Hoodies' }
  }
  if (l.includes('hoodies u ball academy')) {
    return { sectionTitleShort: 'Ball U Hoodies', sectionTitle: 'Ball U Hoodies' }
  }
  if (l === 'mens stuff/mens shorts') {
    return { sectionTitleShort: 'U Shorts', sectionTitle: 'U Shorts' }
  }
  if (l.includes('female u shorts yoga')) {
    return { sectionTitleShort: 'U Shorts Yoga', sectionTitle: 'U Shorts Yoga' }
  }
  if (l.includes('hungry hoodies')) {
    return { sectionTitleShort: 'HU Hoodies', sectionTitle: 'HU Hoodies' }
  }
  if (l.includes('mens hu shirts')) {
    return { sectionTitleShort: 'HU shirt', sectionTitle: 'HU shirt' }
  }
  if (l.includes('hungry female') && l.includes('black logo')) {
    return {
      sectionTitleShort: 'HU shirt — Womens Black Edition',
      sectionTitle: 'HU shirt — Womens Black Edition',
    }
  }
  if (l.includes('hungry female') && l.includes('white logo')) {
    return {
      sectionTitleShort: 'HU shirt — Womens White Edition',
      sectionTitle: 'HU shirt — Womens White Edition',
    }
  }
  if (l.includes('mens ball u shirts')) {
    return { sectionTitleShort: 'Ball U Shirt', sectionTitle: 'Ball U Shirt' }
  }
  if (l.includes('female white u ball logo t-shirts')) {
    return { sectionTitleShort: 'Ball U Shirt', sectionTitle: 'Ball U Shirt' }
  }
  if (l.includes('black logo female crop t-shirt')) {
    return {
      sectionTitleShort: 'U Not Crop - Black Edition',
      sectionTitle: 'U Not Crop - Black Edition',
    }
  }
  if (l.includes('white u ball logo crop')) {
    return {
      sectionTitleShort: 'U Not Crop - White Edition',
      sectionTitle: 'U Not Crop - White Edition',
    }
  }
  return null
}

/** Ball U / HU tee lines use the same display name for mens and womens — add gender on the label. */
function withGenderEditionForSharedShirtLines(text, gender) {
  if (!text) return text
  if (text !== 'Ball U Shirt' && text !== 'HU shirt') return text
  const g = gender === 'womens' ? 'Womens' : 'Mens'
  return `${text} — ${g} Edition`
}

function buildStoreCatalogProduct(relPath, idx) {
  const norm = String(relPath).replace(/\\/g, '/')
  const parts = splitPath(norm)
  const file = parts[parts.length - 1] || ''
  const root = (parts[0] || '').toLowerCase()
  const gender = root.includes('women') ? 'womens' : 'mens'
  const storeType = inferStoreProductType(norm)
  const lower = norm.toLowerCase()
  const rawBase = stripExtension(file)
  let color = extractColor(lower, rawBase)
  /** Folder names include "White"; full path + `light blue` in filename wrongly yields `White & Blue` → White Tee. */
  if (lower.includes('female white u ball logo t-shirts')) {
    color = extractColor(rawBase.toLowerCase(), rawBase)
  }
  if (lower.includes('female u shorts yoga')) {
    color = extractColor(rawBase.toLowerCase(), rawBase)
  }
  /** Folder names repeat Black/White; filenames would pair with path and yield `Black & White` / `White & Blue`. Use filename only. */
  if (lower.includes('hungry female') && (lower.includes('black logo') || lower.includes('white logo'))) {
    color = extractColor(rawBase.toLowerCase(), rawBase)
  }
  /**
   * Two SKUs: `torquise…` = lavender shirt (misspelled filename), `tourquoise…` = turquoise shirt.
   * Womens White Edition HU only.
   */
  if (lower.includes('hungry female') && lower.includes('white logo') && /\btorquise\b/i.test(rawBase)) {
    color = 'Lavender'
  }
  /** U Not Crop - Black Edition: folders repeat “Black”; `crop tshirt1` / `crop tuorquoise` are white / cyan crops. */
  if (lower.includes('black logo female crop t-shirt')) {
    color = extractColor(rawBase.toLowerCase(), rawBase)
    const bn = rawBase.toLowerCase()
    if (/\btshirt1\b/i.test(bn)) color = 'White'
    if (bn.includes('tuorquoise')) color = 'Cyan'
  }
  /** U Not Crop - White Edition: path repeats “White”; basename fixes `Black & White` / `White & Blue`; Torquoise file → cyan crop. */
  if (lower.includes('white u ball logo crop')) {
    color = extractColor(rawBase.toLowerCase(), rawBase)
    const bn = rawBase.toLowerCase()
    if (bn.includes('torquoise') || bn.includes('tourquoise') || bn.includes('turquoise')) color = 'Cyan'
  }

  const folderParts = parts.slice(0, -1)
  const sectionPath = folderParts.join('/')
  let sectionTitle = parts.length > 2 ? parts.slice(1, -1).join(' · ') : gender === 'mens' ? "Men's" : "Women's"
  let sectionTitleShort = buildSectionTitleShort(parts)
  const displayOverride = displayNamesForSectionPath(sectionPath)
  if (displayOverride) {
    if (displayOverride.sectionTitle != null) sectionTitle = displayOverride.sectionTitle
    if (displayOverride.sectionTitleShort != null) sectionTitleShort = displayOverride.sectionTitleShort
  }
  sectionTitle = withGenderEditionForSharedShirtLines(sectionTitle, gender)
  sectionTitleShort = withGenderEditionForSharedShirtLines(sectionTitleShort, gender)
  const sectionSlug = `${gender}-${slugifyPathSegment(sectionPath)}`

  let name = buildShortProductTitle(color, storeType)
  if (
    storeType === 'tshirts'
    && (lower.includes('mens ball u shirts')
      || lower.includes('female white u ball logo t-shirts')
      || (lower.includes('hungry female') && (lower.includes('black logo') || lower.includes('white logo'))))
  ) {
    name = ballUShirtTeeTitleFromColor(color)
  }
  if (storeType === 'hoodies' && lower.includes('pattern u hoodies')) {
    const patternTitle = buildPatternUHoodieProductName(file)
    if (patternTitle) name = patternTitle
  }
  if (storeType === 'shorts' && (sectionPath.toLowerCase() === 'mens stuff/mens shorts' || sectionPath.toLowerCase().includes('female u shorts yoga'))) {
    const shortsTitle = buildUShortsProductName(file)
    if (shortsTitle) {
      name = sectionPath.toLowerCase().includes('female u shorts yoga')
        ? applyUShortsYogaProductTitleOverrides(file, shortsTitle)
        : applyUShortsMensProductTitleOverrides(file, shortsTitle)
    }
  }
  if (
    storeType === 'crop'
    && (lower.includes('black logo female crop t-shirt') || lower.includes('white u ball logo crop'))
  ) {
    name = uNotCropLineCropTitleFromColor(color)
  }
  /** Same as section heading (`products-subcategory-title`): line name, not broad Hoodies/T-Shirts. */
  const category = sectionTitleShort
  const categoryShort = sectionTitleShort

  const id = `store-${storeType}-${slugifyPathSegment(norm)}-${idx}`

  const common = {
    id,
    gender,
    category,
    subcategory: sectionTitleShort,
    collectionLabel: sectionTitle,
    sectionTitleShort,
    categoryShort,
    image: catalogPublicUrl(norm),
    color,
    storePath: norm,
    storeType,
    sectionPath,
    sectionTitle,
    sectionSlug,
    name,
  }

  if (storeType === 'shorts') {
    return {
      ...common,
      description: `Comfortable shorts with room to move — ${sectionTitle}.`,
      price: 44.99,
      size: pickSize(gender, idx),
      material: 'Polyester',
      fit: 'Athletic',
    }
  }
  if (storeType === 'crop') {
    return {
      ...common,
      description: `A confident crop with everyday comfort — ${sectionTitle}.`,
      price: 27.99,
      size: pickSize(gender, idx),
      material: 'Cotton',
      fit: 'Cropped',
    }
  }
  if (storeType === 'tshirts') {
    return {
      ...common,
      description: `Soft cotton tee with bold Ball U character — ${sectionTitle}.`,
      price: 29.99,
      size: pickSize(gender, idx),
      material: 'Cotton',
      fit: 'Regular',
    }
  }
  return {
    ...common,
    description: `Warm hoodie, premium feel — ${sectionTitle}.`,
    price: 59.99,
    size: pickSize(gender, idx),
    material: 'Cotton blend',
    fit: 'Regular',
  }
}

export function getAllStoreProducts() {
  return STORE_CATALOG_PATHS.map((p, i) => buildStoreCatalogProduct(p, i))
}

/** Sizes shown in product details (cart / checkout use the selected value). */
export const PRODUCT_DETAIL_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL']

/**
 * All catalog products in the same folder/collection as `product` (different images = colorways).
 */
export function getVariantsInCollection(product) {
  if (!product) return []
  const path = product.sectionPath
  if (!path) return [product]
  return getAllStoreProducts()
    .filter((p) => p.sectionPath === path)
    .sort((a, b) => (a.color || '').localeCompare(b.color || '', undefined, { sensitivity: 'base' }) || (a.id || '').localeCompare(b.id || ''))
}

/** Full catalog from `public/Mens Stuff` + `public/Women stuff` (regenerate `storeCatalogPaths.js` when assets change). */
export function getAllProducts(_imageNames) {
  return getAllStoreProducts()
}

/** Home page “Shop by style”: curated highlights from the store catalog. */
export function getHomeProducts() {
  const all = getAllStoreProducts()
  const take = (pred) => all.find(pred)
  return [
    take((p) => p.storeType === 'hoodies' && p.gender === 'mens' && p.sectionPath.includes('Pattern U hoodies')),
    take((p) => p.storeType === 'hoodies' && p.gender === 'mens' && p.sectionPath.includes('Hoodies U Ball Academy')),
    take((p) => p.storeType === 'hoodies' && p.gender === 'mens' && p.sectionPath.includes('Hungry Hoodies')),
    take((p) => p.storeType === 'tshirts' && p.gender === 'womens' && p.sectionPath.includes('Female White U ball Logo T-Shirts')),
    take((p) => p.storeType === 'crop'),
    take((p) => p.storeType === 'tshirts' && p.gender === 'mens' && p.sectionPath.includes('Mens ball u shirts')),
    take((p) => p.storeType === 'tshirts' && p.gender === 'mens' && p.sectionPath.includes('Mens HU shirts')),
    take((p) => p.storeType === 'shorts' && p.gender === 'mens'),
    take((p) => p.storeType === 'shorts' && p.gender === 'womens'),
  ].filter(Boolean)
}
