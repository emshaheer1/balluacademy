import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const CART_KEY = 'feliciaCart'
const CartContext = createContext(null)

export function cartLineId(productId, size) {
  return `${productId}__${String(size ?? 'M')}`
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  /** Shown after addToCart — { productName } or null */
  const [addedToCart, setAddedToCart] = useState(null)
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map((i) => ({
            ...i,
            cartLineId: i.cartLineId || cartLineId(i.productId, i.size),
          }))
        }
      }
    } catch (e) {}
    return []
  })

  // Clear cart in memory when user logs out
  useEffect(() => {
    if (!user) {
      setCart([])
      setAddedToCart(null)
    }
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
    } catch (e) {}
  }, [cart])

  const addToCart = useCallback((product, quantity = 1, size, color) => {
    const sz = size ?? product.size ?? 'M'
    const clr = color ?? product.color ?? ''
    const lineId = cartLineId(product.id, sz)
    setCart((prev) => {
      const normalized = prev.map((i) => ({
        ...i,
        cartLineId: i.cartLineId || cartLineId(i.productId, i.size),
      }))
      const existing = normalized.find((i) => i.cartLineId === lineId)
      if (existing) {
        return normalized.map((i) =>
          i.cartLineId === lineId ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [
        ...normalized,
        {
          cartLineId: lineId,
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity,
          size: sz,
          color: clr,
          image: product.image,
        },
      ]
    })
    setAddedToCart({ productName: product.name || 'Item' })
  }, [])

  const dismissAddedToCart = useCallback(() => setAddedToCart(null), [])

  const updateQuantity = useCallback((lineId, delta) => {
    setCart((prev) => {
      const normalized = prev.map((i) => ({
        ...i,
        cartLineId: i.cartLineId || cartLineId(i.productId, i.size),
      }))
      const item = normalized.find((i) => i.cartLineId === lineId)
      if (!item) return prev
      const next = item.quantity + delta
      if (next <= 0) return normalized.filter((i) => i.cartLineId !== lineId)
      return normalized.map((i) =>
        i.cartLineId === lineId ? { ...i, quantity: next } : i
      )
    })
  }, [])

  const removeFromCart = useCallback((lineId) => {
    setCart((prev) =>
      prev
        .map((i) => ({
          ...i,
          cartLineId: i.cartLineId || cartLineId(i.productId, i.size),
        }))
        .filter((i) => i.cartLineId !== lineId)
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setAddedToCart(null)
  }, [])

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        addedToCart,
        dismissAddedToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
