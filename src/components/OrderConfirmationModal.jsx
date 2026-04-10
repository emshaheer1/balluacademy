import { X } from 'lucide-react'

export default function OrderConfirmationModal({ orderId, onClose }) {
  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true">
        <div className="modal-inner info-modal-inner">
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          <div className="info-modal-content">
            <div className="info-modal-icon success-icon">✓</div>
            <h2>Order received</h2>
            <p className="info-modal-message">
              Your order has been received. Your order ID is <strong>{orderId}</strong>.
            </p>
            <button type="button" className="btn-primary" onClick={onClose}>Continue shopping</button>
          </div>
        </div>
      </div>
    </>
  )
}
