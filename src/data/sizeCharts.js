import { publicEncodedAsset } from './products.js'

const DIR = 'Size charts'

/** Public size-chart image for the current product type (paths match `public/Size charts/`). */
export function getSizeChartImageSrc(product) {
  if (!product) return null
  const st = product.storeType
  const gender = product.gender
  const pathLower = String(product.sectionPath || '').toLowerCase()

  if (st === 'hoodies') {
    return publicEncodedAsset(`${DIR}/Hoodies.png`)
  }
  if (st === 'crop') {
    return publicEncodedAsset(`${DIR}/crop Tshirt.png`)
  }
  if (st === 'tshirts') {
    return gender === 'womens'
      ? publicEncodedAsset(`${DIR}/Women T shirt.png`)
      : publicEncodedAsset(`${DIR}/Mens tshirt.png`)
  }
  if (st === 'shorts') {
    if (pathLower.includes('female u shorts yoga') || pathLower.includes('u shorts yoga')) {
      return publicEncodedAsset(`${DIR}/U shorts Yoga.png`)
    }
    return publicEncodedAsset(`${DIR}/U shorts.png`)
  }
  return null
}

export function getSizeChartKindLabel(product) {
  if (!product) return 'Size chart'
  const st = product.storeType
  if (st === 'hoodies') return 'Hoodie size chart'
  if (st === 'crop') return 'Crop T-shirt size chart'
  if (st === 'tshirts') return 'T-shirt size chart'
  if (st === 'shorts') return 'Shorts size chart'
  return 'Size chart'
}
