import Order from '../models/Order.js'
import { generateUniqueBuOrderId, isStripeCheckoutSessionId } from './orderNumber.js'

/**
 * Find an order for a Stripe Checkout Session and normalize legacy rows
 * (where `orderId` used to be the long `cs_…` id) to `BU-…` + `stripeSessionId`.
 */
export async function findAndNormalizeStripeOrder(sessionId) {
  const sid = String(sessionId || '').trim()
  if (!isStripeCheckoutSessionId(sid)) return null

  let order = await Order.findOne({ stripeSessionId: sid })
  if (!order) order = await Order.findOne({ orderId: sid })
  if (!order) return null

  let dirty = false
  if (isStripeCheckoutSessionId(order.orderId)) {
    order.stripeSessionId = sid
    order.orderId = await generateUniqueBuOrderId(Order)
    dirty = true
  } else if (!order.stripeSessionId) {
    order.stripeSessionId = sid
    dirty = true
  }
  if (dirty) await order.save()
  return order
}
