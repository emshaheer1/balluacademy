import { Router } from 'express'
import Order from '../models/Order.js'
import { generateUniqueBuOrderId, isStripeCheckoutSessionId } from '../lib/orderNumber.js'
import { findAndNormalizeStripeOrder } from '../lib/resolveStripeOrder.js'

const router = Router()

function jsonOrder(order) {
  const data = order.toJSON()
  data.date = order.createdAt
  return data
}

// Create order (checkout). Stripe checkouts use `stripeSessionId` + short `BU-` orderId.
// Idempotent by stripeSessionId or by legacy orderId.
router.post('/', async (req, res) => {
  try {
    const { items, total, customerName, customerEmail, stripeSessionId: bodySid, orderId: bodyOrderId } = req.body
    if (!Array.isArray(items) || total == null) {
      return res.status(400).json({ error: 'items and total are required' })
    }

    const sid = String(bodySid || '').trim() || (isStripeCheckoutSessionId(bodyOrderId) ? String(bodyOrderId).trim() : '')
    const legacyId = String(bodyOrderId || '').trim()

    // Stripe-paid order (success page / webhook path)
    if (sid && isStripeCheckoutSessionId(sid)) {
      let order = await findAndNormalizeStripeOrder(sid)
      if (order) {
        return res.status(200).json(jsonOrder(order))
      }

      const shortId = await generateUniqueBuOrderId(Order)
      try {
        order = await Order.create({
          orderId: shortId,
          stripeSessionId: sid,
          items,
          total: Number(total),
          customerName: customerName || '',
          customerEmail: (customerEmail || '').trim().toLowerCase(),
        })
      } catch (e) {
        if (e.code === 11000) {
          order = await Order.findOne({ stripeSessionId: sid })
          if (!order) order = await findAndNormalizeStripeOrder(sid)
          if (order) return res.status(200).json(jsonOrder(order))
        }
        throw e
      }
      return res.status(201).json(jsonOrder(order))
    }

    // Non-Stripe / legacy: explicit orderId (e.g. older clients)
    if (!legacyId) {
      return res.status(400).json({ error: 'stripeSessionId or orderId is required' })
    }

    let order = await Order.findOne({ orderId: legacyId })
    if (order) {
      return res.status(200).json(jsonOrder(order))
    }

    try {
      order = await Order.create({
        orderId: legacyId,
        items,
        total: Number(total),
        customerName: customerName || '',
        customerEmail: (customerEmail || '').trim().toLowerCase(),
      })
    } catch (e) {
      if (e.code === 11000) {
        order = await Order.findOne({ orderId: legacyId })
        if (!order) throw e
        return res.status(200).json(jsonOrder(order))
      }
      throw e
    }
    return res.status(201).json(jsonOrder(order))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
})

// Get orders (optional ?email= for customer's orders)
router.get('/', async (req, res) => {
  try {
    const email = req.query.email
    const query = email ? { customerEmail: email.trim().toLowerCase() } : {}
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500).lean()
    const list = orders.map((o) => ({
      id: o._id.toString(),
      date: o.createdAt,
      orderId: o.orderId,
      items: o.items,
      total: o.total,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      dispatched: Boolean(o.dispatched),
      dispatchedAt: o.dispatchedAt || null,
    }))
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

export default router
