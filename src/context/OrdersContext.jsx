import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../api/client'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.email) {
      setOrders([])
      return
    }
    let cancelled = false
    setLoading(true)
    api(`api/orders?email=${encodeURIComponent(user.email)}`)
      .then((list) => {
        if (!cancelled) setOrders(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.email])

  const addOrder = useCallback(async (orderData) => {
    try {
      const saved = await api('api/orders', {
        method: 'POST',
        body: JSON.stringify({
          stripeSessionId: orderData.stripeSessionId,
          orderId: orderData.orderId,
          items: orderData.items,
          total: orderData.total,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
        }),
      })
      setOrders((prev) => [{ ...orderData, ...saved, date: saved.date || new Date().toISOString() }, ...prev])
    } catch (e) {
      console.error('Failed to save order:', e)
      setOrders((prev) => [{ ...orderData, date: new Date().toISOString() }, ...prev])
    }
  }, [])

  return (
    <OrdersContext.Provider value={{ orders, addOrder, loading }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
