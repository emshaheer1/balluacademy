import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Tag, X } from 'lucide-react'
import { useCart, cartLineId } from '../context/CartContext'
import { api } from '../api/client'

function formatCurrency(v) {
  return `$${Number(v).toFixed(2)}`
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
]

async function validateZipMatchesState(zip, selectedState) {
  const safeZip = String(zip || '').trim()
  if (!/^\d{5}$/.test(safeZip) || !selectedState) return false
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${safeZip}`)
    if (!res.ok) return false
    const data = await res.json()
    const places = Array.isArray(data?.places) ? data.places : []
    return places.some((p) => p['state']?.toLowerCase() === selectedState.toLowerCase())
  } catch (e) {
    return false
  }
}

async function validateUsAddress({ addressLine1, city, state, zipCode }) {
  if (!addressLine1?.trim() || !city?.trim() || !state?.trim() || !zipCode?.trim()) return false
  if (!US_STATES.includes(state)) return false

  const zipAndStateValid = await validateZipMatchesState(zipCode, state)
  if (!zipAndStateValid) return false

  // Verify that line1 + city + state + ZIP resolves to a real US address candidate
  const oneLine = `${addressLine1}, ${city}, ${state} ${zipCode}`
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(oneLine)}&benchmark=Public_AR_Current&format=json`
  try {
    const res = await fetch(url)
    if (!res.ok) return false
    const data = await res.json()
    const matches = data?.result?.addressMatches || []
    if (!matches.length) return false

    return matches.some((m) => {
      const comp = m?.addressComponents || {}
      return (
        comp?.state?.toLowerCase() === state.toLowerCase() &&
        comp?.city?.toLowerCase() === city.toLowerCase() &&
        String(comp?.zip || '').slice(0, 5) === String(zipCode).slice(0, 5)
      )
    })
  } catch (e) {
    return false
  }
}

function isValidUsPhoneNumber(phoneNumber) {
  const digits = String(phoneNumber || '').replace(/\D/g, '')
  // Accept 10-digit US numbers or 11-digit numbers starting with country code 1
  return /^\d{10}$/.test(digits) || /^1\d{10}$/.test(digits)
}

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart()
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddressError, setShowAddressError] = useState(false)
  const [popupMessage, setPopupMessage] = useState('Please enter a valid address to proceed the checkout.')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    zipCode: '',
    state: '',
    city: '',
    phoneNumber: '',
  })

  const handlePromoApply = (e) => {
    e.preventDefault()
    if (promoCode.trim()) {
      setPromoApplied(true)
      setMessage('Promo code will be applied at payment step.')
      setMessageError(false)
    }
  }

  const showInvalidAddressPopup = (text = 'Please enter a valid address to proceed the checkout.') => {
    setPopupMessage(text)
    setShowAddressError(true)
    setMessage(text)
    setMessageError(true)
  }

  const validateRequiredAddressFields = () =>
    Boolean(
      form.firstName && form.lastName && form.email && form.addressLine1 &&
      form.zipCode && form.state && form.city && form.phoneNumber
    )

  const handleSaveAddressAndContinue = async () => {
    setMessage('')
    setMessageError(false)
    if (!validateRequiredAddressFields()) {
      setMessage('Please fill in all required fields.')
      setMessageError(true)
      return
    }
    if (!isValidUsPhoneNumber(form.phoneNumber)) {
      showInvalidAddressPopup('Enter a valid number.')
      return
    }
    const isValid = await validateUsAddress(form)
    if (!isValid) {
      showInvalidAddressPopup()
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageError(false)

    if (!cart.length) {
      setMessage('Your cart is empty. Please add items before placing an order.')
      setMessageError(true)
      return
    }
    if (!validateRequiredAddressFields()) {
      setMessage('Please fill in all required fields.')
      setMessageError(true)
      return
    }
    if (!isValidUsPhoneNumber(form.phoneNumber)) {
      showInvalidAddressPopup('Enter a valid number.')
      return
    }

    const isValid = await validateUsAddress(form)
    if (!isValid) {
      showInvalidAddressPopup()
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
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: form.email,
          address: {
            line1: form.addressLine1,
            line2: form.addressLine2,
            city: form.city,
            state: form.state,
            postalCode: form.zipCode,
            country: 'US',
            phone: form.phoneNumber,
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

  return (
    <main className="checkout-page section">
      <div className="container">
        <div className="cart-page-breadcrumbs">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/cart">Cart</Link>
          <span>›</span>
          <span>Checkout</span>
        </div>
        <div className="checkout-layout">
          <div className="checkout-form-column">
            <form className="checkout-form" onSubmit={handleSubmit}>
              <section className="checkout-step-card">
                <div className="checkout-step-head">
                  <h2>1. Delivery address</h2>
                  <span className="checkout-step-required">*Required field</span>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="checkout-firstName">First name <span className="form-required">*</span></label>
                    <input id="checkout-firstName" type="text" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="checkout-lastName">Last name <span className="form-required">*</span></label>
                    <input id="checkout-lastName" type="text" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-email">Email <span className="form-required">*</span></label>
                  <input id="checkout-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-addressLine1">Address line 1 <span className="form-required">*</span></label>
                  <input id="checkout-addressLine1" type="text" required value={form.addressLine1} onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-addressLine2">Address line 2 (Optional)</label>
                  <input id="checkout-addressLine2" type="text" value={form.addressLine2} onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))} />
                </div>
              <div className="checkout-address-help">
                When autocomplete results are available use up and down arrows to review and enter to select.
                Touch device users, explore by touch or with swipe gestures.
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="checkout-zipCode">Zip code <span className="form-required">*</span></label>
                  <input id="checkout-zipCode" type="text" required inputMode="numeric" maxLength={5} value={form.zipCode} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value.replace(/[^\d]/g, '').slice(0, 5) }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-state">State <span className="form-required">*</span></label>
                  <select id="checkout-state" required value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-city">City <span className="form-required">*</span></label>
                  <input id="checkout-city" type="text" required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="checkout-phoneNumber">Phone number <span className="form-required">*</span></label>
                  <input id="checkout-phoneNumber" type="tel" required value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
                </div>
              </div>
              <button type="button" className="btn-primary checkout-step-continue" onClick={handleSaveAddressAndContinue}>
                Save and continue
              </button>
              </section>

              <section className={`checkout-step-card ${step < 2 ? 'is-disabled' : ''}`}>
                <div className="checkout-step-head">
                  <h2>2. Delivery options</h2>
                </div>
                <div className="checkout-delivery-option active">
                  Standard delivery (USA): 3-5 business days
                </div>
                <button type="button" className="btn-primary checkout-step-continue" onClick={() => setStep(3)} disabled={step < 2}>
                  Save and continue
                </button>
              </section>

              <section className={`checkout-step-card ${step < 3 ? 'is-disabled' : ''}`}>
                <div className="checkout-step-head">
                  <h2>3. Payment method</h2>
                </div>
                <p className="muted small">You will be redirected to secure Stripe checkout for payment.</p>
                <button type="submit" className="btn-primary checkout-submit-btn" disabled={loading || step < 3}>
                  {loading ? 'Redirecting to payment…' : 'Proceed to payment →'}
                </button>
              </section>

              <div className="form-footer">
                <p className="muted small">By placing your order you confirm your cart items and delivery details are correct.</p>
              </div>
              {message && (
                <div className={`checkout-message ${messageError ? 'error' : 'success'}`}>{message}</div>
              )}
            </form>
          </div>

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
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <span>{promoApplied ? '-$0.00' : '$0.00'}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery charges</span>
                  <span>Calculated at payment</span>
                </div>
                {promoApplied && promoCode && (
                  <div className="summary-row summary-row--promo">
                    <span>Promo: {promoCode}</span>
                    <span className="summary-promo-note">Applied at checkout</span>
                  </div>
                )}
                <div className="summary-row summary-row--total">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <p className="muted small summary-tax-note">Taxes and shipping calculated at next step.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddressError && (
        <>
          <div className="modal-backdrop visible" onClick={() => setShowAddressError(false)} aria-hidden="true" />
          <div className="checkout-error-pop" role="dialog" aria-modal="true" aria-label="Address validation error">
            <button type="button" className="checkout-error-close" onClick={() => setShowAddressError(false)} aria-label="Close error popup">
              <X size={18} />
            </button>
            <div className="checkout-error-icon"><AlertTriangle size={22} /></div>
            <p>{popupMessage}</p>
          </div>
        </>
      )}
    </main>
  )
}
