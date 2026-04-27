import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useOpenCart } from '../context/OpenCartContext'
import { useFavourites } from '../context/FavouritesContext'
import { getHomeProducts } from '../data/products'
import { getHeroSlideshowUrls, HERO_REFERENCE_WIDTH, HERO_REFERENCE_HEIGHT } from '../data/heroImgPaths'
import ProductCard from '../components/ProductCard'

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

/** Full-bleed home showcase — uses `public/collection-images/*.png` */
const COLLECTION_SHOWCASE_SLIDES = [
  {
    key: 'u-hoodies',
    title: 'U Hoodies',
    tag: "Men's Collection",
    desc: 'Bold patterns, premium warmth. Built for those who move with purpose and stand out from the crowd.',
    image: '/collection-images/u-hoodie.png',
    link: '/products/mens/u-hoodies',
  },
  {
    key: 'ball-u-hoodies',
    title: 'Ball U Hoodies',
    tag: 'Premium Collection',
    desc: 'Cozy meets bold. Premium warmth with a clean, iconic look for any occasion.',
    image: '/collection-images/u-ball-hoodie.png',
    link: '/products/mens/ball-u-hoodies',
  },
  {
    key: 'ball-u-shirt',
    title: 'Ball U Shirt',
    tag: 'Signature Collection',
    desc: 'Wear the culture. A statement piece representing ambition, style, and the spirit of the game.',
    image: '/collection-images/ball-u-shirt.png',
    link: '/products/mens/ball-u-shirt',
  },
  {
    key: 'u-not-crop',
    title: 'U Not Crop',
    tag: "Women's Collection",
    desc: 'Feminine, fierce, and fashionable. Street-ready style with effortless everyday comfort.',
    image: '/collection-images/crop-tshirt.png',
    link: '/products/womens/u-not-crop',
  },
  {
    key: 'u-shorts-men',
    title: 'U Shorts',
    tag: "Men's Collection",
    desc: 'Engineered for movement. Lightweight comfort meets bold athletic style for training and everyday wear.',
    image: '/collection-images/mens-shorts.png',
    link: '/products/mens/u-shorts',
  },
  {
    key: 'u-shorts-yoga',
    title: 'U Shorts Yoga',
    tag: "Women's Collection",
    desc: 'Flow freely. Designed for flexibility, comfort, and confident movement in every session.',
    image: '/collection-images/yoga-shorts.png',
    link: '/products/womens/u-shorts-yoga',
  },
]

const PRODUCT_SLIDER_INTERVAL_MS = 3000

function getCardsPerView() {
  const w = window.innerWidth
  if (w < 480) return 1
  if (w < 768) return 2
  if (w < 1100) return 3
  return 4
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { cart, addToCart } = useCart()
  const openCart = useOpenCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const navigate = useNavigate()
  const heroSectionRef = useRef(null)
  const sectionsRef = useRef([])

  const heroUrls = useMemo(() => getHeroSlideshowUrls(), [])
  const [heroSlide, setHeroSlide] = useState(0)
  const [heroPauseSlider, setHeroPauseSlider] = useState(false)

  // Products slider state
  const sliderRef = useRef(null)
  const slideStepRef = useRef(0)
  const [cardsPerView, setCardsPerView] = useState(getCardsPerView)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setHeroPauseSlider(reduce)
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

  // Resize handler for slider cards-per-view
  useEffect(() => {
    const onResize = () => setCardsPerView(getCardsPerView())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Auto-scroll slider every 3 s
  useEffect(() => {
    if (!products.length) return
    const id = setInterval(() => {
      const track = sliderRef.current
      if (!track) return
      const card = track.querySelector('.product-card')
      if (!card) return
      const step = card.offsetWidth + 24
      const maxScroll = track.scrollWidth - track.clientWidth
      if (maxScroll <= 0) return
      const nextScroll = track.scrollLeft + step
      if (nextScroll >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
        slideStepRef.current = 0
      } else {
        track.scrollTo({ left: nextScroll, behavior: 'smooth' })
        slideStepRef.current += 1
      }
    }, PRODUCT_SLIDER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [products.length])

  const slideBy = (direction) => {
    const track = sliderRef.current
    if (!track) return
    const card = track.querySelector('.product-card')
    if (!card) return
    const step = card.offsetWidth + 24
    const maxScroll = track.scrollWidth - track.clientWidth
    const nextScroll = direction === 'next'
      ? Math.min(track.scrollLeft + step, maxScroll)
      : Math.max(track.scrollLeft - step, 0)
    track.scrollTo({ left: nextScroll, behavior: 'smooth' })
  }

  const findInCart = (id) =>
    cart.filter((i) => i.productId === id).reduce((sum, i) => sum + (i.quantity || 0), 0)
  const filteredProducts = products
  const goToQuickReview = (product) => {
    if (!product?.id) return
    navigate(`/quick-review/${encodeURIComponent(product.id)}`)
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
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
              Ball U Academy is a lifestyle brand inspired by the culture of the game and the confidence it represents. Our collection of premium hoodies, graphic tees, logo wear, and shorts is designed for people who value comfort, style, and individuality.
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

      {/* ── Sponsor strip ────────────────────────────────────── */}
      <section className="hero-sponsor-strip" aria-label="Ball U Academy highlights">
        <div className="hero-sponsor-marquee">
          <div className="hero-sponsor-track">
            {SPONSOR_STRIP_TAGS.map((label) => (
              <span key={label} className="hero-sponsor-tag">{label}</span>
            ))}
            {SPONSOR_STRIP_TAGS.map((label) => (
              <span key={`${label}-dup`} className="hero-sponsor-tag" aria-hidden="true">{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collections (separate background-image tiles) ─────── */}
      <section id="collections" className="section collections-section">
        <div className="container">
          <div className="section-header animate-on-scroll" ref={(el) => (sectionsRef.current[8] = el)}>
            <h2>Shop Collections</h2>
            <p>Explore every line — find the pieces that speak your style.</p>
          </div>
          <div className="collections-list-long animate-on-scroll" ref={(el) => (sectionsRef.current[10] = el)}>
            {COLLECTION_SHOWCASE_SLIDES.map((slide) => (
              <Link
                key={slide.key}
                to={slide.link}
                className="collections-long-tile"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  '--collection-bg-size': slide.key === 'u-shorts-yoga' ? '70% auto' : 'cover',
                }}
                aria-label={`Shop ${slide.title}`}
              >
                <div className="collections-long-overlay">
                  <span className="collections-long-tag">{slide.tag}</span>
                  <h3
                    className={`collections-long-title ${slide.key === 'ball-u-hoodies' || slide.key === 'u-shorts-yoga' ? 'collections-long-title--singleline' : ''}`}
                  >
                    {slide.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products slider ──────────────────────────────────── */}
      <section id="products" className="section products-section">
        <div className="container">
          <div className="section-header animate-on-scroll" ref={(el) => (sectionsRef.current[0] = el)}>
            <h2>Shop by style</h2>
            <p>Ball U Academy pieces for training days, game nights, and everything in between.</p>
          </div>
          <div className="products-slider animate-on-scroll" ref={(el) => (sectionsRef.current[1] = el)}>
            {filteredProducts.length > cardsPerView && (
              <div className="products-slider-nav products-slider-nav-top" aria-label="Slider navigation">
                <button type="button" className="slider-nav-btn" aria-label="Previous products" onClick={() => slideBy('prev')}>
                  <ChevronLeft size={20} strokeWidth={2} />
                </button>
                <button type="button" className="slider-nav-btn" aria-label="Next products" onClick={() => slideBy('next')}>
                  <ChevronRight size={20} strokeWidth={2} />
                </button>
              </div>
            )}
            <div className="products-slider-outer">
              <div className="products-slider-track" ref={sliderRef}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    inCartQty={findInCart(product.id)}
                    onViewDetails={goToQuickReview}
                    onAddToCart={(p) => addToCart(p, 1)}
                    isFavourite={isFavourite(product.id)}
                    onToggleFavourite={() => toggleFavourite(product)}
                  />
                ))}
              </div>
            </div>
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
          {!loading && !error && products.length > 0 && (
            <div className="view-all-products-wrap">
              <Link to="/products" className="btn-primary view-all-products-btn">View all products</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────── */}
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
                <span className="why-icon" aria-hidden="true"><BadgeCheck size={22} strokeWidth={1.75} /></span>
                <h4>Premium Quality</h4>
                <p>We use only the finest materials—breathable fabrics, durable stitching, and finishes that last season after season.</p>
              </div>
              <div className="why-card">
                <span className="why-icon" aria-hidden="true"><Activity size={22} strokeWidth={1.75} /></span>
                <h4>Designed for Movement</h4>
                <p>Every cut and seam is engineered for athletic performance. Move freely without restriction.</p>
              </div>
              <div className="why-card">
                <span className="why-icon" aria-hidden="true"><ShieldCheck size={22} strokeWidth={1.75} /></span>
                <h4>Secure Checkout</h4>
                <p>Shop with confidence. Our checkout is safe, fast, and your data is always protected.</p>
              </div>
              <div className="why-card">
                <span className="why-icon" aria-hidden="true"><Truck size={22} strokeWidth={1.75} /></span>
                <h4>Fast Shipping</h4>
                <p>Get your order when you need it. We ship quickly so your favorites arrive fast.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────── */}
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

    </>
  )
}
