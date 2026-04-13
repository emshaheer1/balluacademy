import { Router } from 'express'
import Customer from '../models/Customer.js'
import Order from '../models/Order.js'
import Contact from '../models/Contact.js'
import { getOrCreateStats } from '../models/Stats.js'
import { authAdmin } from '../middleware/authAdmin.js'

const router = Router()

router.use(authAdmin)

// All customers (for dashboard)
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 }).lean()
    const list = customers.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      avatarUrl: c.avatarUrl,
      address: c.address,
      signedUpAt: c.createdAt,
    }))
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// All orders (for dashboard)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(500).lean()
    const list = orders.map((o) => ({
      orderId: o.orderId,
      items: o.items,
      total: o.total,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      dispatched: Boolean(o.dispatched),
      dispatchedAt: o.dispatchedAt || null,
      date: o.createdAt,
    }))
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Mark order as dispatched (for dashboard)
router.patch('/orders/:orderId/dispatch', async (req, res) => {
  try {
    const orderId = String(req.params.orderId || '').trim()
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' })

    const order = await Order.findOne({ orderId })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (!order.dispatched) {
      order.dispatched = true
      order.dispatchedAt = new Date()
      await order.save()
    }

    return res.json({
      orderId: order.orderId,
      items: order.items,
      total: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      dispatched: Boolean(order.dispatched),
      dispatchedAt: order.dispatchedAt || null,
      date: order.createdAt,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update dispatch status' })
  }
})

// All contact form submissions (for dashboard)
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).limit(500).lean()
    const list = contacts.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      subject: c.subject,
      message: c.message,
      submittedAt: c.createdAt,
    }))
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch contact requests' })
  }
})

// Stats (for dashboard)
router.get('/stats', async (req, res) => {
  try {
    const stats = await getOrCreateStats()
    return res.json({
      totalVisits: stats.totalVisits || 0,
      lastVisitAt: stats.lastVisitAt,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
