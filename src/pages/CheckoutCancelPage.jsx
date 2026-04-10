import { Link } from 'react-router-dom'

export default function CheckoutCancelPage() {
  return (
    <div className="checkout-result-page">
      <div className="info-modal-content" style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem' }}>
        <div className="info-modal-icon" style={{ fontSize: '2rem' }}>×</div>
        <h2>Payment cancelled</h2>
        <p className="info-modal-message">
          No charge was made. Your cart is still saved — head back whenever you're ready.
        </p>
        <Link to="/products" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Back to shop</Link>
      </div>
    </div>
  )
}
