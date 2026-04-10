import { useEffect, useMemo, useState } from 'react'
import { Heart, StickyNote, X } from 'lucide-react'
import { useFavourites } from '../context/FavouritesContext'
import { FALLBACK_IMG, PRODUCT_DETAIL_SIZES, getVariantsInCollection } from '../data/products'

function formatCurrency(v) {
  return `$${Number(v).toFixed(2)}`
}

function buildModalCopy(product) {
  const genderLabel = product?.gender === 'womens' ? 'Womens' : 'Mens'
  const sub = String(product?.subcategory || product?.category || '').toLowerCase()
  const st = product?.storeType

  let apparelLabel = 'Apparel'
  if (st === 'crop' || sub.includes('crop')) apparelLabel = 'Crop T-Shirt'
  else if (st === 'tshirts' || sub.includes('t-shirt') || sub.includes('tee')) apparelLabel = 'T-Shirt'
  else if (st === 'shorts' || sub.includes('short')) apparelLabel = 'Shorts'
  else if (st === 'hoodies' || sub.includes('hoodie')) apparelLabel = 'Hoodie'

  const title = `${genderLabel} ${apparelLabel}`

  const descriptionMap = {
    'Mens T-Shirt': 'A premium mens t-shirt built for everyday confidence, clean style, and all-day comfort. It is designed to keep you sharp from casual outings to active routines.',
    'Womens T-Shirt': 'A flattering womens t-shirt designed to combine effortless style with lasting comfort. Perfect for daily wear, workouts, and street-ready looks.',
    'Mens Crop T-Shirt': 'A modern mens crop t-shirt crafted for bold, confident styling with breathable comfort. Built to stand out while staying easy to wear.',
    'Womens Crop T-Shirt': 'A chic womens crop t-shirt that blends fashion-forward design with soft comfort. Ideal for active days, layering, and statement outfits.',
    'Mens Hoodie': 'A premium mens hoodie made for warmth, movement, and standout style. It delivers a strong streetwear look with comfort clients can wear all day.',
    'Womens Hoodie': 'A stylish womens hoodie designed for cozy comfort and confident everyday fashion. It pairs premium feel with a modern silhouette.',
    'Mens Shorts': 'Performance-ready mens shorts built for comfort, flexibility, and clean athletic style. Great for training, travel, and daily wear.',
    'Womens Shorts': 'Lightweight womens shorts created for ease, movement, and versatile styling. Designed to keep you comfortable and confident through the day.',
  }

  const description =
    descriptionMap[title]
    || product?.description
    || 'Premium apparel designed to blend comfort, quality, and confident style.'

  return { title, description }
}

export default function ProductDetailsModal({ product, onClose, onAddToCart }) {
  const { isFavourite, toggleFavourite } = useFavourites()
  const [selectedSize, setSelectedSize] = useState('M')
  const [activeVariant, setActiveVariant] = useState(product)

  const variants = useMemo(() => (product ? getVariantsInCollection(product) : []), [product])

  useEffect(() => {
    if (!product) return
    setSelectedSize('M')
    const list = getVariantsInCollection(product)
    const match = list.find((v) => v.id === product.id) || list[0]
    setActiveVariant(match || product)
  }, [product?.id])

  if (!product || !activeVariant) return null

  const { description } = buildModalCopy(activeVariant)
  const fav = isFavourite(activeVariant.id)

  const handleAddToCart = () => {
    onAddToCart?.(activeVariant, 1, selectedSize, activeVariant.color)
    onClose?.()
  }

  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="product-details-title">
        <div className="modal-inner product-details-inner">
          <button type="button" className="modal-close" aria-label="Close product details" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          <div className="product-details-layout product-details-layout-pro">
            <div className="product-details-media product-details-media-pro">
              <div className="product-details-media-frame">
                <img
                  key={activeVariant.id}
                  src={activeVariant.image}
                  alt={`${activeVariant.name} — ${activeVariant.color || 'product'}`}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = FALLBACK_IMG
                  }}
                />
              </div>
              <div className="product-details-size-note-box" role="note" aria-label="Sizing note">
                <span className="product-details-size-note-icon" aria-hidden="true">
                  <StickyNote size={18} strokeWidth={2} />
                </span>
                <p className="product-details-size-note-text">
                  Sizes follow <strong>US standard apparel sizing</strong>. If you are between sizes, we recommend sizing up for a relaxed fit.
                </p>
              </div>
            </div>
            <div className="product-details-content product-details-content-pro">
              <p className="product-details-eyebrow">{activeVariant.categoryShort || activeVariant.category}</p>
              <h2 id="product-details-title" className="product-details-title-short product-details-title-pro">{activeVariant.name}</h2>
              <p className="product-details-price-lead">{formatCurrency(activeVariant.price)}</p>
              <p className="product-details-lede">{description}</p>

              <div className="product-details-panel">
                <div className="product-details-option-block">
                  <div className="product-details-option-head">
                    <span className="product-details-option-label">Size</span>
                    <span className="product-details-option-hint">Select one</span>
                  </div>
                  <div className="product-details-size-grid" role="listbox" aria-label="Size">
                    {PRODUCT_DETAIL_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        role="option"
                        aria-selected={selectedSize === sz}
                        className={`product-details-pill ${selectedSize === sz ? 'is-selected' : ''}`}
                        onClick={() => setSelectedSize(sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="product-details-option-block">
                  <div className="product-details-option-head">
                    <span className="product-details-option-label">Color</span>
                    <span className="product-details-option-value">{activeVariant.color || 'Standard'}</span>
                  </div>
                  <div className="product-details-color-strip" role="listbox" aria-label="Color">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        role="option"
                        aria-selected={activeVariant.id === v.id}
                        aria-label={v.color || 'Color option'}
                        className={`product-details-color-swatch ${activeVariant.id === v.id ? 'is-selected' : ''}`}
                        onClick={() => setActiveVariant(v)}
                        title={v.color}
                      >
                        <span className="product-details-color-swatch-img">
                          <img src={v.image} alt="" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG }} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <dl className="product-details-meta-grid">
                  <div>
                    <dt>Material</dt>
                    <dd>{activeVariant.material || '—'}</dd>
                  </div>
                  <div>
                    <dt>Fit</dt>
                    <dd>{activeVariant.fit || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="details-footer product-details-footer-pro">
                <button
                  type="button"
                  className={`favourite-btn favourite-btn-modal ${fav ? 'active' : ''}`}
                  onClick={() => toggleFavourite(activeVariant)}
                  aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart size={20} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} />
                </button>
                <button type="button" className="btn-primary product-details-add-btn" onClick={handleAddToCart}>
                  Add to cart — {selectedSize}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
