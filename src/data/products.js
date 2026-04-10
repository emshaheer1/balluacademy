import { STORE_CATALOG_PATHS } from './storeCatalogPaths.js'

export const MENS_SUBCATEGORIES = ['Pattern Hoodies', 'Logo Branded Hoodies', 'Shorts', 'T-Shirts']
export const WOMENS_SUBCATEGORIES = ['Pattern Hoodies', 'Logo Branded Hoodies', 'Shorts', 'T-Shirts', 'Crop Top T-Shirts']

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
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
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
  if (folder.includes('printed hoodie')) return 'Pattern Hoodies'

  // Fallback.
  if (lower.includes('hoodie') || lower.includes('logo') || lower.includes('court')) return 'Logo Branded Hoodies'
  return 'Pattern Hoodies'
}

function extractColor(lower, rawBase) {
  if (lower.includes('black') && lower.includes('white')) return 'Black & White'
  if (lower.includes('red') && lower.includes('black')) return 'Red & Black'
  if (lower.includes('white') && (lower.includes('blue') || lower.includes('royal') || lower.includes('navy'))) return 'White & Blue'
  if (lower.includes('army green')) return 'Army Green'
  if (lower.includes('royal blue')) return 'Royal Blue'
  if (lower.includes('navy blue')) return 'Navy Blue'
  if (lower.includes('light pink')) return 'Light Pink'
  if (lower.includes('light grey') || lower.includes('lightgrey') || lower.includes('light gray') || lower.includes('lightgrey')) return 'Light Grey'
  if (lower.includes('chocolate brown')) return 'Chocolate Brown'
  if (lower.includes('burgandy') || lower.includes('burgundy')) return 'Burgandy'
  if (lower.includes('lavender')) return 'Lavender'
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
    name: subcategory === 'Logo Branded Hoodies' ? `${color} Logo Hoodie` : `${color} Pattern Hoodie`,
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

/** One word from first folder under Mens/Women stuff (e.g. Ball, Pattern, Unisex). */
function folderHintWord(parts, category) {
  const folder = parts[1] || ''
  const tokens = folder.split(/\s+/).map((t) => t.replace(/[^a-z0-9']/gi, '')).filter((t) => t.length > 0)
  const skip = new Set([
    'mens',
    'womens',
    'stuff',
    'logo',
    'collection',
    'female',
    'male',
    'and',
    'the',
    'u',
    'hu',
  ])
  if (category === 'Shorts') skip.add('shorts')
  if (category === 'Hoodies') {
    skip.add('hoodies')
    skip.add('hoodie')
  }
  if (category === 'T-Shirts') {
    skip.add('shirts')
    skip.add('shirt')
    skip.add('tshirt')
    skip.add('tshirts')
    skip.add('tee')
    skip.add('tees')
    skip.add('crop')
  }
  const w = tokens.find((t) => !skip.has(t.toLowerCase()))
  return titleize(w || 'Core')
}

/** Exactly 3 words: gender + category style + folder hint. */
function buildShortCategoryLabel(gender, category, parts) {
  const g = gender === 'mens' ? 'Mens' : 'Womens'
  const cat =
    category === 'Shorts' ? 'Shorts' : category === 'Hoodies' ? 'Hoodie' : 'Tee'
  const hint = folderHintWord(parts, category)
  return truncateToWords(`${g} ${cat} ${hint}`, 3)
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

function buildStoreCatalogProduct(relPath, idx) {
  const norm = String(relPath).replace(/\\/g, '/')
  const parts = splitPath(norm)
  const file = parts[parts.length - 1] || ''
  const root = (parts[0] || '').toLowerCase()
  const gender = root.includes('women') ? 'womens' : 'mens'
  const storeType = inferStoreProductType(norm)
  const lower = norm.toLowerCase()
  const rawBase = stripExtension(file)
  const color = extractColor(lower, rawBase)

  const folderParts = parts.slice(0, -1)
  const sectionPath = folderParts.join('/')
  const sectionTitle = parts.length > 2 ? parts.slice(1, -1).join(' · ') : gender === 'mens' ? "Men's" : "Women's"
  const sectionTitleShort = buildSectionTitleShort(parts)
  const sectionSlug = `${gender}-${slugifyPathSegment(sectionPath)}`

  const categoryMap = {
    shorts: { category: 'Shorts' },
    crop: { category: 'T-Shirts' },
    tshirts: { category: 'T-Shirts' },
    hoodies: { category: 'Hoodies' },
  }
  const { category } = categoryMap[storeType]

  const name = buildShortProductTitle(color, storeType)
  const categoryShort = buildShortCategoryLabel(gender, category, parts)

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
