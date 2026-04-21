function pathLower(product) {
  return String(product?.sectionPath || '').toLowerCase()
}

export const MEN_COLLECTION_MENU = [
  { key: 'u-hoodies', label: 'U Hoodies' },
  { key: 'u-shorts', label: 'U Shorts' },
  { key: 'ball-u-hoodies', label: 'Ball U Hoodies' },
  { key: 'hu-hoodies', label: 'HU Hoodies' },
  { key: 'hu-shirt', label: 'HU Shirt' },
  { key: 'ball-u-shirt', label: 'Ball U Shirt' },
  { key: 'all', label: 'All Mens Products' },
]

export const WOMEN_COLLECTION_MENU = [
  { key: 'u-shorts-yoga', label: 'U Shorts Yoga' },
  { key: 'hu-shirt', label: 'HU Shirt' },
  { key: 'ball-u-shirt', label: 'Ball U Shirt' },
  { key: 'u-not-crop', label: 'U Not Crop' },
  { key: 'all', label: 'All Womens Products' },
]

export function getCollectionDisplayName(key) {
  const map = {
    'u-hoodies': 'U Hoodies',
    'u-shorts': 'U Shorts',
    'u-shorts-yoga': 'U Shorts Yoga',
    'hu-shirt': 'HU Shirt',
    'hu-hoodies': 'HU Hoodies',
    'ball-u-shirt': 'Ball U Shirt',
    'ball-u-hoodies': 'Ball U Hoodies',
    'u-not-tees': 'U Not Tees',
    'u-not-crop': 'U Not Crop',
    all: 'All Products',
  }
  return map[key] || 'Products'
}

/**
 * Canonical collection labels for a catalog folder path (must match nav + product cards).
 * Paths stay as on disk for image URLs; this is display-only.
 */
export function getCatalogSectionTitles(sectionPath) {
  const norm = String(sectionPath || '').replace(/\\/g, '/')
  const l = norm.toLowerCase().replace(/\s+/g, ' ').trim()
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
    return { sectionTitleShort: 'HU Shirt', sectionTitle: 'HU Shirt' }
  }
  if (l.includes('hungry female') && l.includes('black logo')) {
    return {
      sectionTitleShort: 'HU Shirt - Black Edition',
      sectionTitle: 'HU Shirt - Black Edition',
    }
  }
  if (l.includes('hungry female') && l.includes('white logo')) {
    return {
      sectionTitleShort: 'HU Shirt - White Edition',
      sectionTitle: 'HU Shirt - White Edition',
    }
  }
  if (l.includes('mens ball u shirts')) {
    return { sectionTitleShort: 'Ball U Shirt', sectionTitle: 'Ball U Shirt' }
  }
  if (l.includes('female white u ball logo t-shirts')) {
    return { sectionTitleShort: 'Ball U Shirt', sectionTitle: 'Ball U Shirt' }
  }
  if (l.includes('black logo female crop t-shirt') || l.includes('black logo female crop tshirt')) {
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

export function matchesCollectionKey(product, key) {
  if (!key || key === 'all') return true
  const lower = pathLower(product)

  if (key === 'u-hoodies') return lower.includes('pattern u hoodies')
  if (key === 'u-shorts') return lower === 'mens stuff/mens shorts'
  if (key === 'u-shorts-yoga') return lower.includes('female u shorts yoga')
  if (key === 'hu-hoodies') return lower.includes('hungry hoodies')
  if (key === 'hu-shirt') {
    return lower.includes('mens hu shirts') || (lower.includes('hungry female') && (lower.includes('black logo') || lower.includes('white logo')))
  }
  if (key === 'ball-u-shirt') {
    return lower.includes('mens ball u shirts') || lower.includes('female white u ball logo t-shirts')
  }
  if (key === 'ball-u-hoodies') return lower.includes('hoodies u ball academy')
  if (key === 'u-not-tees') return lower.includes('u not ready') || lower.includes('u-not-ready')
  if (key === 'u-not-crop') {
    return (
      lower.includes('black logo female crop t-shirt')
      || lower.includes('black logo female crop tshirt')
      || lower.includes('white u ball logo crop')
    )
  }
  return true
}
