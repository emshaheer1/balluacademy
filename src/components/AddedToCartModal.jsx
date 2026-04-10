import { CheckCircle2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useOpenCart } from '../context/OpenCartContext'

export default function AddedToCartModal() {
  const { addedToCart, dismissAddedToCart } = useCart()
  const openCart = useOpenCart()

  if (!addedToCart) return null

  const handleViewCart = () => {
    dismissAddedToCart()
    openCart()
  }

  return (
    <>
      <div className="modal-backdrop visible" onClick={dismissAddedToCart} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="added-to-cart-title">
        <div className="modal-inner info-modal-inner">
          <button type="button" className="modal-close" aria-label="Close" onClick={dismissAddedToCart}><X size={20} strokeWidth={2} /></button>
          <div className="info-modal-content">
            <div className="info-modal-icon added-to-cart-icon" aria-hidden="true">
              <CheckCircle2 size={48} strokeWidth={1.5} />
            </div>
            <h2 id="added-to-cart-title">Item added to cart</h2>
            <p className="info-modal-message">
              {addedToCart.productName ? (
                <>
                  <span className="added-to-cart-product-name">{addedToCart.productName}</span> is in your cart.
                </>
              ) : (
                'Your item is in your cart.'
              )}
            </p>
            <div className="added-to-cart-actions">
              <button type="button" className="btn-primary" onClick={handleViewCart}>
                View cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
