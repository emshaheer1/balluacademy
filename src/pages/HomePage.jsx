import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BadgeCheck, RotateCcw, Search, ShieldCheck, Truck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useOpenCart } from '../context/OpenCartContext'
import { useFavourites } from '../context/FavouritesContext'
import { getHomeProducts } from '../data/products'
import { getHeroSlideshowUrls, HERO_REFERENCE_WIDTH, HERO_REFERENCE_HEIGHT } from '../data/heroImgPaths'
import ProductCard from '../components/ProductCard'
import ProductDetailsModal from '../components/ProductDetailsModal'

/** Auto-advance interval for hero image slider (ms). */
const HERO_SLIDE_MS = 5200

const SPONSOR_STRIP_TAGS = [
  'Ball U Academy',
  'Premium Court-Ready',
  'Style & Confidence',
  'Bold Designs',
  'Everyday Comfort',
  'Secure Checkout',
  'Designed for Movement',
]

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { cart, addToCart } = useCart()
  const openCart = useOpenCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const heroSectionRef = useRef(null)
  const sectionsRef = useRef([])

  const heroUrls = useMemo(() => getHeroSlideshowUrls(), [])
  const [heroSlide, setHeroSlide] = useState(0)
  const [heroPauseSlider, setHeroPauseSlider] = useState(false)

  useEffect(() => {
    setHeroPauseSlider(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    setProducts(getHomeProducts())
    setError(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('animated')
        })
      },
      { threshold: 0.05, rootMargin: '50px' }
    )
    const toObserve = [heroSectionRef.current, ...sectionsRef.current].filter(Boolean)
    toObserve.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [products])

  useEffect(() => {
    if (heroUrls.length <= 1 || heroPauseSlider) return
    const id = window.setInterval(() => {
      setHeroSlide((i) => (i + 1) % heroUrls.length)
    }, HERO_SLIDE_MS)
    return () => window.clearInterval(id)
  }, [heroUrls.length, heroPauseSlider])

  const findInCart = (id) =>
    cart.filter((i) => i.productId === id).reduce((sum, i) => sum + (i.quantity || 0), 0)
  const searchTrimmed = searchQuery.trim()
  const matchProduct = (product, q) => {
    if (!q) return true
    const term = q.toLowerCase()
    const name = (product.name || '').toLowerCase()
    const sub = (product.subcategory || '').toLowerCase()
    const cat = (product.category || '').toLowerCase()
    const desc = (product.description || '').toLowerCase()
    const path = (product.sectionPath || '').toLowerCase()
    const catShort = String(product.categoryShort || '').toLowerCase()
    const secShort = String(product.sectionTitleShort || '').toLowerCase()
    return name.includes(term) || sub.includes(term) || cat.includes(term) || desc.includes(term) || path.includes(term) || catShort.includes(term) || secShort.includes(term)
  }
  const filteredProducts = searchTrimmed ? products.filter((p) => matchProduct(p, searchTrimmed)) : products

  return (
    <>
      <section id="home" className="hero animate-on-scroll" ref={heroSectionRef}>
        <div className="hero-bg-shapes">
          <span className="hero-shape hero-shape-1" />
          <span className="hero-shape hero-shape-2" />
          <span className="hero-shape hero-shape-3" />
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">Premium Everyday Apparel</span>
            <h1>More Than Apparel.<br /><span className="hero-accent">It's Ball U.</span></h1>
            <p className="hero-sub">
              Ball U Academy is a lifestyle brand inspired by the culture of the game and the confidence it represents. Our collection of premium hoodies, graphic tees, logo wear, and shorts is designed for people who value comfort, style, and individuality. Whether you're out with friends, at the gym, or on the move, Ball U Academy lets you wear the energy of the game wherever life takes you.
            </p>
            <div className="hero-actions">
              <Link to="/#products" className="btn-primary btn-hero">Shop the collection</Link>
              <button type="button" className="btn-ghost btn-hero" onClick={openCart}>View cart</button>
            </div>
            <div className="hero-highlights">
              <span className="hero-highlight"><span className="hero-check">✓</span> Secure checkout</span>
              <span className="hero-highlight"><span className="hero-check">✓</span> Premium fabrics</span>
              <span className="hero-highlight"><span className="hero-check">✓</span> Designed for movement</span>
            </div>

            <div className="hero-feature-cards">
              <div className="hero-feature-card hero-feature-card--accent">
                <div className="hero-feature-icon"><Truck size={18} strokeWidth={2} aria-hidden="true" /></div>
                <div className="hero-feature-title">Fast Shipping</div>
                <div className="hero-feature-sub">Get your gear when you need it.</div>
              </div>
              <div className="hero-feature-card">
                <div className="hero-feature-icon"><RotateCcw size={18} strokeWidth={2} aria-hidden="true" /></div>
                <div className="hero-feature-title">Easy Returns</div>
                <div className="hero-feature-sub">Simple returns, stress-free fit.</div>
              </div>
              <div className="hero-feature-card">
                <div className="hero-feature-icon"><BadgeCheck size={18} strokeWidth={2} aria-hidden="true" /></div>
                <div className="hero-feature-title">Size Ready</div>
                <div className="hero-feature-sub">Find the right fit in seconds.</div>
              </div>
            </div>
          </div>
          <div className="hero-gallery">
            <div
              className="hero-slideshow-shell"
              role="region"
              aria-roledescription="carousel"
              aria-label="Featured looks"
              aria-live="polite"
            >
              <div
                className="hero-slideshow"
                style={{ aspectRatio: `${HERO_REFERENCE_WIDTH} / ${HERO_REFERENCE_HEIGHT}` }}
              >
                {heroUrls.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className={`hero-slideshow-slide ${i === heroSlide ? 'is-active' : ''}`}
                    aria-hidden={i !== heroSlide}
                  >
                    <img
                      src={src}
                      alt=""
                      className="hero-slideshow-img"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hero-sponsor-strip" aria-label="Ball U Academy highlights">
        <div className="hero-sponsor-marquee">
          <div className="hero-sponsor-track">
            {SPONSOR_STRIP_TAGS.map((label) => (
              <span key={label} className="hero-sponsor-tag">
                {label}
              </span>
            ))}
            {SPONSOR_STRIP_TAGS.map((label) => (
              <span key={`${label}-dup`} className="hero-sponsor-tag" aria-hidden="true">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="section products-section">
        <div className="container">
          <div className="section-header animate-on-scroll" ref={(el) => (sectionsRef.current[0] = el)}>
            <h2>Shop by style</h2>
            <p>Ball U Academy pieces for training days, game nights, and everything in between.</p>
          </div>
          <div className="products-search-wrap">
            <Search size={20} strokeWidth={2} className="products-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="products-search-input"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
              autoComplete="off"
            />
          </div>
          <div className="product-grid animate-on-scroll" ref={(el) => (sectionsRef.current[1] = el)}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCartQty={findInCart(product.id)}
                onViewDetails={setSelectedProduct}
                onAddToCart={(p) => addToCart(p, 1)}
                isFavourite={isFavourite(product.id)}
                onToggleFavourite={() => toggleFavourite(product)}
              />
            ))}
          </div>
          {loading && <div className="loading-state">Loading products...</div>}
          {error && (
            <div className="error-state">
              We couldn't load the products. Please refresh the page.
            </div>
          )}
          {!loading && !error && !products.length && (
            <p className="small muted" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No products found.</p>
          )}
          {!loading && !error && searchTrimmed && !filteredProducts.length && (
            <p className="products-search-empty" style={{ gridColumn: '1 / -1' }}>No products match &quot;{searchTrimmed}&quot;.</p>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="view-all-products-wrap">
              <Link to="/products" className="btn-primary view-all-products-btn">View all products</Link>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="section about-section">
        <div className="container">
          <div className="section-header animate-on-scroll" ref={(el) => (sectionsRef.current[2] = el)}>
            <h2>About Ball U Academy</h2>
            <p>Where comfort meets style, every day.</p>
          </div>
          <div className="about-content">
            <div className="about-text animate-on-scroll" ref={(el) => (sectionsRef.current[4] = el)}>
              <h3>Designed for everyday confidence</h3>
              <p>
                Ball U Academy was designed around the game of life. As we express ourselves through our talents, our work ethic, our personality and everything that makes us who we are, remember...
              </p>
              <ul className="about-bullet-list" aria-label="Ball U Academy message">
                <li><span className="about-bullet-arrow" aria-hidden="true">&rarr;</span> U were born to leave an impact</li>
                <li><span className="about-bullet-arrow" aria-hidden="true">&rarr;</span> U were built to handle any obstacles that come your way</li>
                <li><span className="about-bullet-arrow" aria-hidden="true">&rarr;</span> U were destined for greatness</li>
                <li><span className="about-bullet-arrow" aria-hidden="true">&rarr;</span> U are more than enough!</li>
              </ul>
              <p>
                Our brand creates modern apparel for men and women who appreciate bold designs, premium quality, and everyday comfort. From statement hoodies and graphic shirts to versatile shorts, each piece reflects the spirit of ambition, creativity, and self-expression.
              </p>
              <p>
                At Ball U Academy, we believe clothing is more than what you wear it's how you represent yourself. Our goal is to create apparel that fits seamlessly into your lifestyle while capturing modern, expressive fashion.
              </p>
            </div>
            <div className="about-stats animate-on-scroll" ref={(el) => (sectionsRef.current[5] = el)}>
              <div className="stat-card"><span className="stat-number">10+</span><span className="stat-label">Curated designs</span></div>
              <div className="stat-card"><span className="stat-number">3</span><span className="stat-label">Core categories</span></div>
              <div className="stat-card"><span className="stat-number">24/7</span><span className="stat-label">Online store</span></div>
              <div className="stat-card"><span className="stat-number">100%</span><span className="stat-label">Quality assured</span></div>
            </div>
          </div>
          <div className="why-choose-us animate-on-scroll" ref={(el) => (sectionsRef.current[6] = el)}>
            <h3>Why Choose Us</h3>
            <div className="why-grid">
              <div className="why-card">
                <span className="why-icon" aria-hidden="true">
                  <BadgeCheck size={22} strokeWidth={1.75} />
                </span>
                <h4>Premium Quality</h4>
                <p>We use only the finest materials—breathable fabrics, durable stitching, and finishes that last season after season.</p>
              </div>
              <div className="why-card">
                <span className="why-icon" aria-hidden="true">
                  <Activity size={22} strokeWidth={1.75} />
                </span>
                <h4>Designed for Movement</h4>
                <p>Every cut and seam is engineered for athletic performance. Move freely without restriction.</p>
              </div>
              <div className="why-card">
                <span className="why-icon" aria-hidden="true">
                  <ShieldCheck size={22} strokeWidth={1.75} />
                </span>
                <h4>Secure Checkout</h4>
                <p>Shop with confidence. Our checkout is safe, fast, and your data is always protected.</p>
              </div>
              <div className="why-card">
                <span className="why-icon" aria-hidden="true">
                  <Truck size={22} strokeWidth={1.75} />
                </span>
                <h4>Fast Shipping</h4>
                <p>Get your order when you need it. We ship quickly so your favorites arrive fast.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="section reviews-section">
        <div className="container">
          <div className="section-header animate-on-scroll" ref={(el) => (sectionsRef.current[3] = el)}>
            <h2>What our customers say</h2>
            <p>Real feedback from people who wear Ball U Academy in everyday life.</p>
          </div>
          <div className="reviews-grid animate-on-scroll" ref={(el) => (sectionsRef.current[7] = el)}>
            <div className="review-card">
              <div className="review-quote">"</div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">Best hoodie I've ever owned. The fit is perfect for movement and the quality is top-notch.</p>
              <div className="review-footer">
                <span className="review-author">Marcus J.</span>
                <span className="review-verified">Verified buyer</span>
              </div>
            </div>
            <div className="review-card review-card-featured">
              <div className="review-quote">"</div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">Love the shirts! Super comfortable, great quality, and they look perfect for everyday wear. Highly recommend!</p>
              <div className="review-footer">
                <span className="review-author">Sarah K.</span>
                <span className="review-verified">Verified buyer</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-quote">"</div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">The shorts are lightweight and breathable. Exactly what I needed for training sessions.</p>
              <div className="review-footer">
                <span className="review-author">David L.</span>
                <span className="review-verified">Verified buyer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p, qty, size, color) => addToCart(p, qty ?? 1, size, color)}
        />
      )}
    </>
  )
}
