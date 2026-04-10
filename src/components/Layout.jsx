import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, ShoppingCart, X, ChevronDown, LogIn } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import { OpenCartProvider } from '../context/OpenCartContext'
import CheckoutModal from './CheckoutModal'
import OrderConfirmationModal from './OrderConfirmationModal'
import EmptyCartModal from './EmptyCartModal'
import AddedToCartModal from './AddedToCartModal'
import LoginModal from './LoginModal'
import ProfileDropdown from './ProfileDropdown'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { api } from '../api/client'

function ScrollToHash() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), location.pathname === '/products' ? 150 : 80)
    }
  }, [location.pathname, location.hash])
  return null
}

function ScrollToTopOnLoad() {
  const location = useLocation()
  const hasScrolledToTop = useRef(false)
  useEffect(() => {
    if (!location.hash && !hasScrolledToTop.current) {
      window.scrollTo(0, 0)
      hasScrolledToTop.current = true
    }
  }, [location.pathname, location.hash])
  return null
}

function HashLink({ to, className, children, onClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHash = to.startsWith('/#')
  const hashId = isHash ? to.slice(2) : null
  const onHashClick = (e) => {
    if (onClick) onClick(e)
    if (location.pathname === '/' && hashId) {
      e.preventDefault()
      document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (isHash) {
      e.preventDefault()
      navigate(to)
    }
  }
  if (isHash) {
    return (
      <a href={to} className={className} onClick={onHashClick}>
        {children}
      </a>
    )
  }
  return <Link to={to} className={className} onClick={onClick}>{children}</Link>
}

function Header({ onOpenCart, onOpenLogin, profileOpen, onOpenProfile, onCloseProfile }) {
  const { toggle } = useTheme()
  const { cartCount } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false)
  const profileButtonRef = useRef(null)
  const productsDropdownRef = useRef(null)

  const isContact = location.pathname === '/contact'
  const isProducts = location.pathname === '/products'
  const navLinkClass = (path) => {
    if (path === '/contact') return isContact ? 'nav-active' : ''
    if (path === '/products') return isProducts ? 'nav-active' : ''
    return ''
  }

  const closeNav = () => setNavOpen(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(e.target)) setProductsDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="site-header">
        <div className="container header-content">
          <Link to="/" className="brand" aria-label="Ball U Academy home">
            <img src="/logo.png" alt="" className="brand-logo" />
          </Link>
          <button
            className="nav-toggle"
            aria-label="Open menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>
          <nav className={`main-nav ${navOpen ? 'open' : ''}`} id="main-nav">
            <button className="nav-close" type="button" aria-label="Close menu" onClick={closeNav}><X size={20} strokeWidth={2} /></button>
            <Link to="/" onClick={closeNav}>Home</Link>
            <HashLink to="/#about" onClick={closeNav}>About Us</HashLink>
            <div className="nav-products-wrap" ref={productsDropdownRef}>
              <button type="button" className={`nav-products-trigger ${isProducts ? 'nav-active' : ''} ${productsDropdownOpen ? 'open' : ''}`} onClick={() => setProductsDropdownOpen((o) => !o)} aria-expanded={productsDropdownOpen} aria-haspopup="true">
                Products <ChevronDown size={16} strokeWidth={2} className="nav-products-chevron" />
              </button>
              <div className={`nav-products-dropdown ${productsDropdownOpen ? 'open' : ''}`}>
                <Link to="/products#mens" onClick={() => { setProductsDropdownOpen(false); closeNav(); }}>Men&apos;s</Link>
                <Link to="/products#womens" onClick={() => { setProductsDropdownOpen(false); closeNav(); }}>Women&apos;s</Link>
              </div>
            </div>
            <HashLink to="/#reviews" onClick={closeNav}>Reviews</HashLink>
            <Link to="/contact" className={navLinkClass('/contact')} onClick={closeNav}>Contact Us</Link>
          </nav>
          <div className="header-right">
            <button type="button" className="theme-toggle" aria-label="Toggle dark mode" onClick={toggle}>
              <span className="theme-icon-sun" aria-hidden="true"><Sun size={20} strokeWidth={2} /></span>
              <span className="theme-icon-moon" aria-hidden="true"><Moon size={20} strokeWidth={2} /></span>
            </button>
            {isContact ? (
              <Link to="/" className="cart-toggle" aria-label="Back to store">
                <ShoppingCart size={20} strokeWidth={2} className="cart-icon" />
                <span>Store</span>
              </Link>
            ) : (
              <button type="button" className="cart-toggle" aria-label="Open cart and checkout" onClick={onOpenCart}>
                <ShoppingCart size={20} strokeWidth={2} className="cart-icon" />
                <span className="cart-count">{cartCount}</span>
              </button>
            )}
            {user ? (
              <div className="header-profile-wrap">
                <button type="button" ref={profileButtonRef} className="profile-trigger profile-trigger-avatar-only" onClick={() => (profileOpen ? onCloseProfile() : onOpenProfile())} aria-expanded={profileOpen} aria-haspopup="true" aria-label="Profile">
                  <span className="profile-trigger-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : (user.name ? user.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?')}</span>
                </button>
                {profileOpen && <ProfileDropdown onClose={onCloseProfile} buttonRef={profileButtonRef} />}
              </div>
            ) : (
              <button type="button" className="login-toggle" aria-label="Sign in" onClick={onOpenLogin}>
                <LogIn size={18} strokeWidth={2} className="login-toggle-icon" aria-hidden="true" />
                <span className="login-toggle-text">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="nav-overlay" aria-hidden="true" onClick={closeNav} />
    </>
  )
}

function BackToTop({ visible, onClick }) {
  if (!visible) return null
  return (
    <button
      type="button"
      className="back-to-top"
      onClick={onClick}
      aria-label="Back to top"
    >
      <span className="back-to-top-icon" aria-hidden>↑</span>
      <span className="back-to-top-label">Back to top</span>
    </button>
  )
}

function Footer({ footerRef }) {
  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="container footer-content">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/logo.png" alt="" className="footer-logo" />
            <p className="footer-intro">
              Premium apparel for anyone who values comfort, quality, and standout style every day.
            </p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <HashLink to="/#about">About Us</HashLink>
            <HashLink to="/#products">Products</HashLink>
            <HashLink to="/#reviews">Reviews</HashLink>
            <Link to="/contact">Contact Us</Link>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=balluacademy%40gmail.com"
              target="_blank"
              rel="noreferrer"
            >
              balluacademy@gmail.com
            </a>
          </div>
          <div className="footer-social">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://www.tiktok.com/@officialballuacademy?_r=1&_t=ZT-95Q3tKJ9uMn" target="_blank" rel="noreferrer" aria-label="TikTok" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69A4.83 4.83 0 0 1 16 4.55V15.2a5.2 5.2 0 1 1-5.2-5.2c.24 0 .47.02.7.05v2.56a2.65 2.65 0 0 0-.7-.09 2.64 2.64 0 1 0 2.64 2.64V2h2.56a4.83 4.83 0 0 0 3.59 3.03v1.66z"/></svg>
              </a>
              <a href="https://x.com/balluacademy?s=21&t=y8Pm1t_sa73iDba9W95SbA" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.instagram.com/officialballuacademy?igsh=MTVkdWk2cWNob3c3dQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Ball U Academy. All rights reserved.</span>
          <span className="footer-developed">Developed by Xevibox Team</span>
        </div>
      </div>
    </footer>
  )
}

export default function Layout({ children }) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [showEmptyCart, setShowEmptyCart] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [backToTopVisible, setBackToTopVisible] = useState(false)
  const footerRef = useRef(null)
  const { cart } = useCart()
  const { addOrder } = useOrders()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    api('api/stats/visit', { method: 'POST' }).catch(() => {})
  }, [])

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return
    const observer = new IntersectionObserver(
      ([entry]) => setBackToTopVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '0px' }
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenCart = () => {
    if (cart.length === 0) {
      setShowEmptyCart(true)
    } else {
      setShowCheckout(true)
    }
  }

  const handleOrderSuccess = (orderData) => {
    if (orderData && typeof orderData === 'object' && orderData.orderId) {
      addOrder(orderData)
      setOrderId(orderData.orderId)
    } else {
      setOrderId(orderData)
    }
    setShowCheckout(false)
  }

  return (
    <OpenCartProvider openCart={handleOpenCart}>
      <ScrollToHash />
      <ScrollToTopOnLoad />
      <Header
        onOpenCart={handleOpenCart}
        onOpenLogin={() => setShowLogin(true)}
        profileOpen={profileOpen}
        onOpenProfile={() => setProfileOpen(true)}
        onCloseProfile={() => setProfileOpen(false)}
      />
      <main className="main-content">{children}</main>
      <Footer footerRef={footerRef} />
      <BackToTop visible={backToTopVisible} onClick={scrollToTop} />

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
        />
      )}
      {orderId != null && (
        <OrderConfirmationModal
          orderId={orderId}
          onClose={() => setOrderId(null)}
        />
      )}
      {showEmptyCart && (
        <EmptyCartModal onClose={() => setShowEmptyCart(false)} />
      )}
      <AddedToCartModal />
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}
    </OpenCartProvider>
  )
}
