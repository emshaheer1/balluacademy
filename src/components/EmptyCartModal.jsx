import { useNavigate } from 'react-router-dom'
import { ShoppingCart, X } from 'lucide-react'

export default function EmptyCartModal({ onClose }) {
  const navigate = useNavigate()
  const goToProducts = () => {
    onClose()
    navigate('/#products')
  }
  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true">
        <div className="modal-inner info-modal-inner">
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          <div className="info-modal-content">
            <div className="info-modal-icon empty-icon"><ShoppingCart size={48} strokeWidth={1.5} /></div>
            <h2>Your cart is empty</h2>
            <p className="info-modal-message">Add some items to your cart before checking out.</p>
            <button type="button" className="btn-primary" onClick={goToProducts}>Browse products</button>
          </div>
        </div>
      </div>
    </>
  )
}
