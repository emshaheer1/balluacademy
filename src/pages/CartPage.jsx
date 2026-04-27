import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Tag, X } from 'lucide-react'
import { cartLineId, useCart } from '../context/CartContext'

function formatCurrency(v) {
  return `$${Number(v || 0).toFixed(2)}`
}

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, cartTotal, updateQuantity, removeFromCart } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [showEmptyCartPopup, setShowEmptyCartPopup] = useState(false)

  const deliveryFee = cart.length ? 15 : 0
  const discount = promoApplied ? cartTotal * 0.2 : 0
  const total = Math.max(0, cartTotal - discount + deliveryFee)

  const handleApplyPromo = (e) => {
    e.preventDefault()
    if (!promoCode.trim()) return
    setPromoApplied(true)
  }

  const cartRows = useMemo(
    () =>
      cart.map((item) => ({
        ...item,
        lineId: item.cartLineId || cartLineId(item.productId, item.size),
      })),
    [cart],
  )

  const handleProceedToPayment = () => {
    if (!cartRows.length) {
      setShowEmptyCartPopup(true)
      return
    }
    navigate('/checkout-auth')
  }

  return (
    <main className="cart-page section">
      <div className="container">
        <div className="cart-page-breadcrumbs">
          <Link to="/">Home</Link>
          <span>›</span>
          <span>Cart</span>
        </div>
        <h1 className="cart-page-title">Your Cart</h1>

        <div className="cart-page-layout">
          <section className="cart-page-items">
            {!cartRows.length ? (
              <div className="cart-page-empty">
                <p>Your cart is empty.</p>
                <Link to="/products" className="btn-primary">Continue shopping</Link>
              </div>
            ) : (
              <div className="cart-page-items-list">
                {cartRows.map((item) => (
                  <article key={item.lineId} className="cart-page-item">
                    <div className="cart-item-thumb">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-main">
                      <h3 className="cart-item-title">{item.name}</h3>
                      <div className="cart-item-meta">Size: {item.size || 'M'} · Color: {item.color || '—'}</div>
                      <div className="cart-item-price">{formatCurrency(item.price)}</div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-controls">
                        <button type="button" className="qty-control" onClick={() => updateQuantity(item.lineId, -1)}>−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button type="button" className="qty-control" onClick={() => updateQuantity(item.lineId, 1)}>+</button>
                      </div>
                      <div className="cart-item-line-total">{formatCurrency(item.price * item.quantity)}</div>
                      <button type="button" className="remove-btn" onClick={() => removeFromCart(item.lineId)}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="cart-page-summary">
            <h2>Order Summary</h2>
            <div className="cart-page-summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="summary-row">
                <span>Discount</span>
                <span>{promoApplied ? `-${formatCurrency(discount)}` : '$0.00'}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="summary-row summary-row--total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <form className="cart-page-promo" onSubmit={handleApplyPromo}>
              <label htmlFor="cart-promo" className="checkout-promo-label">
                <Tag size={14} strokeWidth={2} aria-hidden="true" />
                Promo code
              </label>
              <div className="checkout-promo-row">
                <input
                  id="cart-promo"
                  type="text"
                  className="checkout-promo-input"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value)
                    setPromoApplied(false)
                  }}
                />
                <button type="submit" className="checkout-promo-btn" disabled={!promoCode.trim() || promoApplied}>
                  {promoApplied ? 'Applied' : 'Apply'}
                </button>
              </div>
            </form>

            <button
              type="button"
              className="btn-primary cart-page-checkout-btn"
              onClick={handleProceedToPayment}
            >
              Proceed to payment
            </button>
          </aside>
        </div>
      </div>

      {showEmptyCartPopup && (
        <>
          <div className="modal-backdrop visible" onClick={() => setShowEmptyCartPopup(false)} aria-hidden="true" />
          <div className="cart-empty-pop" role="dialog" aria-modal="true" aria-label="Cart empty message">
            <button type="button" className="cart-empty-pop-close" onClick={() => setShowEmptyCartPopup(false)} aria-label="Close">
              <X size={18} />
            </button>
            <div className="cart-empty-pop-icon">
              <ShoppingCart size={22} />
            </div>
            <h3>Your cart is empty</h3>
            <p>Add items to your cart before proceeding to payment.</p>
            <Link to="/products" className="btn-primary" onClick={() => setShowEmptyCartPopup(false)}>
              Continue shopping
            </Link>
          </div>
        </>
      )}
    </main>
  )
}
