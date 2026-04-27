import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, Ruler, X } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { useFavourites } from '../context/FavouritesContext'
import { FALLBACK_IMG, PRODUCT_DETAIL_SIZES, getAllProducts, getVariantsInCollection } from '../data/products'
import { getSizeChartImageSrc, getSizeChartKindLabel } from '../data/sizeCharts'

function formatCurrency(v) {
  return `$${Number(v).toFixed(2)}`
}

function buildPageCopy(product) {
  const genderLabel = product?.gender === 'womens' ? 'Womens' : 'Mens'
  const sub = String(product?.subcategory || product?.category || '').toLowerCase()
  const st = product?.storeType

  let apparelLabel = 'Apparel'
  if (st === 'crop' || sub.includes('crop')) apparelLabel = 'Crop T-Shirt'
  else if (st === 'tshirts' || sub.includes('t-shirt') || sub.includes('tee')) apparelLabel = 'T-Shirt'
  else if (st === 'shorts' || sub.includes('short')) apparelLabel = 'Shorts'
  else if (st === 'hoodies' || sub.includes('hoodie')) apparelLabel = 'Hoodie'

  const title = `${genderLabel} ${apparelLabel}`
  const description =
    product?.description || 'Premium apparel designed to blend comfort, quality, and confident style.'
  return { title, description }
}

export default function ProductQuickReviewPage() {
  const { productId: encodedId } = useParams()
  const productId = decodeURIComponent(encodedId || '')
  const navigate = useNavigate()
  const { cart, addToCart } = useCart()
  const { isFavourite, toggleFavourite } = useFavourites()

  const allProducts = useMemo(() => getAllProducts(), [])
  const product = useMemo(() => allProducts.find((p) => p.id === productId) || null, [allProducts, productId])
  const [selectedSize, setSelectedSize] = useState('M')
  const [activeVariant, setActiveVariant] = useState(product)
  const [sizeChartOpen, setSizeChartOpen] = useState(false)

  const variants = useMemo(() => (product ? getVariantsInCollection(product) : []), [product])
  const chartSrc = useMemo(() => getSizeChartImageSrc(activeVariant), [activeVariant])
  const chartLabel = useMemo(() => getSizeChartKindLabel(activeVariant), [activeVariant])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [productId])

  useEffect(() => {
    if (!product) return
    setSelectedSize('M')
    setSizeChartOpen(false)
    const match = variants.find((v) => v.id === product.id) || variants[0]
    setActiveVariant(match || product)
  }, [product?.id, variants])

  const recommendations = useMemo(() => {
    if (!activeVariant) return []
    const candidates = allProducts.filter((p) => p.id !== activeVariant.id)
    const key = String(activeVariant.sectionTitleShort || activeVariant.categoryShort || '').toLowerCase()
    const sameType = candidates.filter((p) => p.storeType === activeVariant.storeType)
    const sameLine = sameType.filter(
      (p) => String(p.sectionTitleShort || p.categoryShort || '').toLowerCase() === key,
    )
    const sameLineSameGender = sameLine.filter((p) => p.gender === activeVariant.gender)
    const sameLineOtherGender = sameLine.filter((p) => p.gender !== activeVariant.gender)
    const sameTypeSameGender = sameType.filter(
      (p) =>
        p.gender === activeVariant.gender
        && String(p.sectionTitleShort || p.categoryShort || '').toLowerCase() !== key,
    )
    const sameTypeOtherGender = sameType.filter(
      (p) =>
        p.gender !== activeVariant.gender
        && String(p.sectionTitleShort || p.categoryShort || '').toLowerCase() !== key,
    )

    return [
      ...sameLineSameGender,
      ...sameLineOtherGender,
      ...sameTypeSameGender,
      ...sameTypeOtherGender,
    ].slice(0, 8)
  }, [allProducts, activeVariant])

  const inCartQty = (id) => cart.filter((i) => i.productId === id).reduce((sum, i) => sum + (i.quantity || 0), 0)
  const goToQuickReview = (p) => p?.id && navigate(`/quick-review/${encodeURIComponent(p.id)}`)

  if (!product || !activeVariant) {
    return (
      <main className="products-page">
        <section className="section">
          <div className="container">
            <p className="small muted">Product not found.</p>
            <Link to="/products" className="btn-primary">Back to products</Link>
          </div>
        </section>
      </main>
    )
  }

  const { title, description } = buildPageCopy(activeVariant)
  const fav = isFavourite(activeVariant.id)

  return (
    <main className="products-page">
      <section className="section quick-review-page">
        <div className="container">
          <div className="quick-review-back-link">
            <Link to="/products" className="products-nav-link">← Back to products</Link>
          </div>

          <div className="quick-review-layout">
            <div className="quick-review-info">
              <p className="product-details-eyebrow">{activeVariant.categoryShort || activeVariant.category}</p>
              <h1 className="quick-review-title">{activeVariant.name}</h1>
              <p className="quick-review-price">{formatCurrency(activeVariant.price)}</p>
              <p className="quick-review-copy">{description}</p>

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
                  <div><dt>Material</dt><dd>{activeVariant.material || '—'}</dd></div>
                  <div><dt>Fit</dt><dd>{activeVariant.fit || '—'}</dd></div>
                </dl>
              </div>

              <div className="quick-review-actions">
                <button
                  type="button"
                  className={`favourite-btn favourite-btn-modal ${fav ? 'active' : ''}`}
                  onClick={() => toggleFavourite(activeVariant)}
                  aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart size={20} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className="btn-primary product-details-add-btn"
                  onClick={() => addToCart(activeVariant, 1, selectedSize, activeVariant.color)}
                >
                  Add to cart — {selectedSize}
                </button>
                {chartSrc ? (
                  <button
                    type="button"
                    className="product-details-size-chart-btn quick-review-chart-btn"
                    onClick={() => setSizeChartOpen(true)}
                  >
                    <Ruler size={18} strokeWidth={2} aria-hidden />
                    Size chart
                  </button>
                ) : null}
              </div>
            </div>

            <div className="quick-review-media">
              <div className="product-details-media-frame">
                <img
                  key={activeVariant.id}
                  src={activeVariant.image}
                  alt={`${activeVariant.name} — ${activeVariant.color || 'product'}`}
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section quick-review-recommendations">
        <div className="container">
          <div className="section-header">
            <h2>Recommended For You</h2>
            <p>More {activeVariant.storeType === 'crop' ? 'crop tees' : activeVariant.storeType} from men&apos;s and women&apos;s collections.</p>
          </div>
          <div className="product-grid">
            {recommendations.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                inCartQty={inCartQty(item.id)}
                onViewDetails={goToQuickReview}
                onAddToCart={(p) => addToCart(p, 1)}
                isFavourite={isFavourite(item.id)}
                onToggleFavourite={() => toggleFavourite(item)}
              />
            ))}
          </div>
        </div>
      </section>

      {sizeChartOpen && chartSrc ? (
        <>
          <div className="size-chart-lightbox-backdrop" aria-hidden="true" onClick={() => setSizeChartOpen(false)} />
          <div className="size-chart-lightbox" role="dialog" aria-modal="true" aria-label={chartLabel}>
            <div className="size-chart-lightbox-card">
              <button
                type="button"
                className="size-chart-lightbox-close"
                aria-label="Close size chart"
                onClick={() => setSizeChartOpen(false)}
              >
                <X size={20} strokeWidth={2} />
              </button>
              <div className="size-chart-lightbox-body">
                <img src={chartSrc} alt={chartLabel} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </main>
  )
}
