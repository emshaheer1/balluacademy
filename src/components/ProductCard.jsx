import { useState } from 'react'
import { Heart } from 'lucide-react'
import { FALLBACK_IMG } from '../data/products'

function formatCurrency(v) {
  return `$${Number(v).toFixed(2)}`
}

export default function ProductCard({ product, inCartQty, onViewDetails, onAddToCart, isFavourite, onToggleFavourite }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const metaLabel = product?.categoryShort || product?.category || ''
  return (
    <article className="product-card">
      <div className="product-image">
        <img
          src={product.image}
          alt={`${product.name}${product.collectionLabel ? ` — ${product.collectionLabel}` : ''}`}
          className={imgLoaded ? 'loaded' : ''}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; e.target.onload = () => setImgLoaded(true) }}
        />
        <button
          type="button"
          className={`favourite-btn favourite-btn-mobile-top ${isFavourite ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavourite?.() }}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart size={18} strokeWidth={2} fill={isFavourite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-meta">
        <span className="product-category">{metaLabel}</span>
        <span className="product-price">{formatCurrency(product.price)}</span>
      </div>
      <h3 className="product-title">{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <div className="product-actions">
        <span className="qty-badge">{inCartQty ? `In cart: ${inCartQty}` : '\u00A0'}</span>
        <div className="product-actions-buttons">
          <button type="button" className="view-details-btn" onClick={() => onViewDetails(product)}>View details</button>
          <button type="button" className={`favourite-btn favourite-btn-inline ${isFavourite ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleFavourite?.() }} aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}>
            <Heart size={18} strokeWidth={2} fill={isFavourite ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="add-to-cart-btn" onClick={() => onAddToCart(product)}><span>+</span> Add</button>
        </div>
      </div>
    </article>
  )
}
