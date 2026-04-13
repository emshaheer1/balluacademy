import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api } from '../api/client'

function formatCurrency(v) {
  return `$${Number(v || 0).toFixed(2)}`
}

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()

  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found.')
      setLoading(false)
      return
    }

    clearCart()

    api(`api/stripe/session/${sessionId}`)
      .then(async (data) => {
        setOrder(data)
        // Save to MongoDB even if Stripe webhook never reached the server (e.g. local dev).
        try {
          await api('api/orders', {
            method: 'POST',
            body: JSON.stringify({
              orderId: data.orderId,
              items: data.items,
              total: data.total,
              customerName: data.customerName,
              customerEmail: data.customerEmail,
            }),
          })
        } catch (e) {
          console.warn('Could not persist order to database:', e?.message || e)
        }
      })
      .catch((e) => setError(e.message || 'Could not load order details.'))
      .finally(() => setLoading(false))
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="checkout-result-page">
      {loading && <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>Loading your order...</p>}

      {!loading && error && (
        <div className="info-modal-content" style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem' }}>
          <div className="info-modal-icon" style={{ fontSize: '2rem' }}>!</div>
          <h2>Something went wrong</h2>
          <p className="info-modal-message">{error}</p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Back to shop</Link>
        </div>
      )}

      {!loading && order && (
        <div className="info-modal-content" style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem' }}>
          <div className="info-modal-icon success-icon" style={{ fontSize: '2rem' }}>✓</div>
          <h2>Payment successful</h2>
          <p className="info-modal-message">
            Thanks{order.customerName ? `, ${order.customerName}` : ''}! Your order has been confirmed.
            A receipt has been sent to <strong>{order.customerEmail}</strong>.
          </p>

          <div style={{ margin: '1.5rem 0', textAlign: 'left' }}>
            <p className="muted small" style={{ marginBottom: '0.5rem' }}>Order ID: <code style={{ fontSize: '0.75rem' }}>{order.orderId}</code></p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>{item.name} {item.size ? `(${item.size})` : ''} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <Link to="/products" className="btn-primary" style={{ display: 'inline-block' }}>Continue shopping</Link>
        </div>
      )}
    </div>
  )
}
