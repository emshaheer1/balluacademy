import { Router } from 'express'
import Order from '../models/Order.js'

const router = Router()

// Create order (checkout) — idempotent by orderId so the success page can persist
// when the Stripe webhook did not run (common in local dev without stripe listen).
router.post('/', async (req, res) => {
  try {
    const { orderId, items, total, customerName, customerEmail } = req.body
    if (!orderId || !Array.isArray(items) || total == null) {
      return res.status(400).json({ error: 'orderId, items and total are required' })
    }

    const existing = await Order.findOne({ orderId })
    if (existing) {
      const data = existing.toJSON()
      data.date = existing.createdAt
      return res.status(200).json(data)
    }

    let order
    try {
      order = await Order.create({
        orderId,
        items,
        total: Number(total),
        customerName: customerName || '',
        customerEmail: (customerEmail || '').trim().toLowerCase(),
      })
    } catch (e) {
      if (e.code === 11000) {
        order = await Order.findOne({ orderId })
        if (!order) throw e
      } else {
        throw e
      }
    }
    const data = order.toJSON()
    data.date = order.createdAt
    return res.status(201).json(data)
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
      ...o,
      id: o._id.toString(),
      date: o.createdAt,
      orderId: o.orderId,
      items: o.items,
      total: o.total,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
    }))
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

export default router
