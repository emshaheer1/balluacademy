import { useState } from 'react'
import { X, Tag } from 'lucide-react'
import { useCart, cartLineId } from '../context/CartContext'
import { api } from '../api/client'

function formatCurrency(v) {
  return `$${v.toFixed(2)}`
}

export default function CheckoutModal({ onClose, onSuccess }) {
  const { cart, cartTotal } = useCart()
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageError(false)

    if (!cart.length) {
      setMessage('Your cart is empty. Please add items before placing an order.')
      setMessageError(true)
      return
    }

    if (!form.name || !form.email || !form.address) {
      setMessage('Please fill in all required fields (marked with *).')
      setMessageError(true)
      return
    }

    setLoading(true)
    try {
      const { url } = await api('api/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            image: i.image,
          })),
          customerName: form.name,
          customerEmail: form.email,
          address: {
            line1: form.address,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country,
          },
        }),
      })
      window.location.href = url
    } catch (err) {
      setMessage(err.message || 'Failed to start checkout. Please try again.')
      setMessageError(true)
      setLoading(false)
    }
  }

  const handlePromoApply = (e) => {
    e.preventDefault()
    if (promoCode.trim()) {
      setPromoApplied(true)
      setMessage('Promo code will be applied at payment step.')
      setMessageError(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-inner checkout-inner">
          <button type="button" className="modal-close" aria-label="Close checkout" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          <div className="checkout-layout">

            {/* LEFT — Customer information */}
            <div className="checkout-form-column">
              <div className="checkout-col-header">
                <h2>Shipping details</h2>
                <p className="checkout-col-sub">Enter your address so we can confirm your order.</p>
              </div>
              <form className="checkout-form" onSubmit={handleSubmit} id="checkout-form">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-name">Full name <span className="form-required">*</span></label>
                    <input id="checkout-name" type="text" required placeholder="John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-email">Email <span className="form-required">*</span></label>
                    <input id="checkout-email" type="email" required placeholder="you@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-phone">Phone</label>
                    <input id="checkout-phone" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-country">Country</label>
                    <input id="checkout-country" type="text" placeholder="United States" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-address">Street address <span className="form-required">*</span></label>
                  <input id="checkout-address" type="text" required placeholder="123 Main St, Apt 4B" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-city">City</label>
                    <input id="checkout-city" type="text" placeholder="New York" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-postalCode">Postal code</label>
                    <input id="checkout-postalCode" type="text" placeholder="10001" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
                  </div>
                </div>

                {/* Promo code */}
                <div className="checkout-promo">
                  <label className="checkout-promo-label">
                    <Tag size={14} strokeWidth={2} aria-hidden="true" />
                    Promo code
                  </label>
                  <div className="checkout-promo-row">
                    <input
                      type="text"
                      className="checkout-promo-input"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false) }}
                    />
                    <button
                      type="button"
                      className="checkout-promo-btn"
                      onClick={handlePromoApply}
                      disabled={!promoCode.trim() || promoApplied}
                    >
                      {promoApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>

                <div className="form-footer">
                  <p className="muted small">By placing your order you confirm your cart items and contact details are correct.</p>
                  <button type="submit" className="btn-primary checkout-submit-btn" disabled={loading}>
                    {loading ? 'Redirecting to payment…' : 'Proceed to payment →'}
                  </button>
                </div>
                {message && (
                  <div className={`checkout-message ${messageError ? 'error' : 'success'}`}>{message}</div>
                )}
              </form>
            </div>

            {/* RIGHT — Order summary */}
            <div className="checkout-cart-column">
              <div className="checkout-col-header">
                <h2>Order summary</h2>
                <p className="checkout-col-sub">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
              </div>

              <div className="cart-items">
                {!cart.length ? (
                  <p className="small muted" style={{ padding: '0.75rem', textAlign: 'center' }}>Your cart is empty.</p>
                ) : (
                  cart.map((item) => {
                    const line = item.cartLineId || cartLineId(item.productId, item.size)
                    return (
                      <div key={line} className="cart-item">
                        <div className="cart-item-thumb">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="cart-item-main">
                          <div className="cart-item-title">{item.name}</div>
                          <div className="cart-item-meta">Size: {item.size || 'M'} · Color: {item.color || '—'}</div>
                          <div className="cart-item-price">
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                        </div>
                        <div className="cart-item-controls checkout-order-summary-line-total">
                          <div className="cart-item-line-total">{formatCurrency(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  {promoApplied && promoCode && (
                    <div className="summary-row summary-row--promo">
                      <span>Promo: {promoCode}</span>
                      <span className="summary-promo-note">Applied at checkout</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="summary-shipping-note">Calculated at payment</span>
                  </div>
                  <div className="summary-row summary-row--total">
                    <span>Estimated total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <p className="muted small summary-tax-note">Taxes and shipping calculated at next step.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
