import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { useCart, cartLineId } from '../context/CartContext'
import { api } from '../api/client'

function formatCurrency(v) {
  return `$${v.toFixed(2)}`
}

export default function CheckoutModal({ onClose, onSuccess }) {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [loading, setLoading] = useState(false)

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
      // Redirect to Stripe hosted checkout — cart is cleared on successful return via /checkout/success
      window.location.href = url
    } catch (err) {
      setMessage(err.message || 'Failed to start checkout. Please try again.')
      setMessageError(true)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-inner checkout-inner">
          <button type="button" className="modal-close" aria-label="Close checkout" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          <div className="checkout-layout">
            <div className="checkout-cart-column">
              <h2>Your cart</h2>
              <p className="muted">Review your items before entering your details.</p>
              <div className="checkout-cart-body">
                <div className="checkout-cart-main">
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
                              <div className="cart-item-meta">Size: {item.size || 'M'} • Color: {item.color || '—'}</div>
                              <div className="cart-item-meta">Unit: {formatCurrency(item.price)}</div>
                            </div>
                            <div className="cart-item-controls">
                              <div className="qty-controls">
                                <button type="button" className="qty-control" onClick={() => updateQuantity(line, -1)}>−</button>
                                <span className="qty-value">{item.quantity}</span>
                                <button type="button" className="qty-control" onClick={() => updateQuantity(line, 1)}>+</button>
                              </div>
                              <button type="button" className="remove-btn" onClick={() => removeFromCart(line)}>Remove</button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <p className="muted small">Taxes and shipping are calculated after your order.</p>
                  </div>
                </div>
                <aside className="cart-side-note" aria-label="Shopping tip">
                  <span className="cart-side-note-icon" aria-hidden="true"><Info size={18} strokeWidth={2} /></span>
                  <p>
                    Please select your <strong>size</strong> and <strong>color</strong> in the product <strong>View details</strong> before adding to your cart, so your order matches what you want.
                  </p>
                </aside>
              </div>
            </div>
            <div className="checkout-form-column">
              <h2>Customer details</h2>
              <p className="muted">Enter your information so we can confirm your order.</p>
              <form className="checkout-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-name">Full name*</label>
                    <input id="checkout-name" type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-email">Email*</label>
                    <input id="checkout-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-phone">Phone</label>
                    <input id="checkout-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-country">Country</label>
                    <input id="checkout-country" type="text" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-address">Address*</label>
                  <input id="checkout-address" type="text" required value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-city">City</label>
                    <input id="checkout-city" type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-postalCode">Postal code</label>
                    <input id="checkout-postalCode" type="text" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
                  </div>
                </div>
                <div className="form-footer">
                  <p className="muted small">By placing your order, you confirm that your cart items and contact details are correct.</p>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Redirecting to payment...' : 'Proceed to payment'}
                  </button>
                </div>
                {message && (
                  <div className={`checkout-message ${messageError ? 'error' : ''}`}>{message}</div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
