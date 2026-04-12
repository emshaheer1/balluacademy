import { Router } from 'express'
import Stripe from 'stripe'
import Order from '../models/Order.js'

const router = Router()

// Server-side price catalog — client prices are never trusted
const PRODUCT_PRICES = {
  shorts: 44.99,
  crop: 27.99,
  tshirts: 29.99,
  hoodies: 59.99,
}

function priceFromProductId(productId) {
  const id = String(productId || '').toLowerCase()
  if (id.includes('shorts')) return PRODUCT_PRICES.shorts
  if (id.includes('crop')) return PRODUCT_PRICES.crop
  if (id.includes('tshirts')) return PRODUCT_PRICES.tshirts
  if (id.includes('hoodie')) return PRODUCT_PRICES.hoodies
  return null
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, customerName, customerEmail } = req.body

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    const email = String(customerEmail || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Customer email is required' })

    // Validate all items have known prices before touching Stripe
    for (const item of items) {
      if (!priceFromProductId(item.productId)) {
        return res.status(400).json({ error: `Unknown product: ${item.productId}` })
      }
    }

    const stripe = getStripe()
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

    const lineItems = items.map((item) => {
      const unitPrice = priceFromProductId(item.productId)
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
      const meta = {
        productId: item.productId,
        size: item.size || '',
        color: item.color || '',
        category: String(item.category || '').slice(0, 500),
        image: String(item.image || '').slice(0, 500),
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            metadata: meta,
            // Only pass HTTPS image URLs — localhost won't work with Stripe
            ...(item.image?.startsWith('https://') ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: qty,
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: {
        customerName: String(customerName || '').trim().slice(0, 500),
      },
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel`,
    })

    return res.json({ url: session.url })
  } catch (e) {
    console.error('Stripe session error:', e.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// POST /api/stripe/webhook
// Requires raw body — app.use('/api/stripe/webhook', express.raw(...)) must be set before express.json()
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return res.status(500).end()
  }

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (e) {
    console.error('Webhook signature verification failed:', e.message)
    return res.status(400).json({ error: `Webhook error: ${e.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Only process paid sessions
    if (session.payment_status !== 'paid') return res.json({ received: true })

    try {
      const stripe = getStripe()

      // Retrieve line items with product metadata to reconstruct the order
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product'],
      })

      const items = (fullSession.line_items?.data || []).map((li) => {
        const product = li.price?.product
        const meta = product?.metadata || {}
        return {
          productId: meta.productId || '',
          name: product?.name || li.description || '',
          category: meta.category || '',
          quantity: li.quantity,
          price: (li.price?.unit_amount || 0) / 100,
          size: meta.size || '',
          color: meta.color || '',
          image: meta.image || '',
        }
      })

      const total = (session.amount_total || 0) / 100
      const customerEmail = (session.customer_email || session.metadata?.customerEmail || '').toLowerCase()
      const customerName = session.metadata?.customerName || ''

      await Order.create({
        orderId: session.id,
        items,
        total,
        customerName,
        customerEmail,
      })
    } catch (e) {
      if (e.code !== 11000) {
        // 11000 = duplicate key — already saved, safe to ignore
        console.error('Failed to save order from webhook:', e.message)
      }
    }
  }

  return res.json({ received: true })
})

// GET /api/stripe/session/:sessionId — used by success page to confirm payment and show order details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['line_items.data.price.product'],
    })

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' })
    }

    const items = (session.line_items?.data || []).map((li) => {
      const product = li.price?.product
      const meta = product?.metadata || {}
      return {
        productId: meta.productId || '',
        name: product?.name || '',
        category: meta.category || '',
        quantity: li.quantity,
        price: (li.price?.unit_amount || 0) / 100,
        size: meta.size || '',
        color: meta.color || '',
        image: meta.image || '',
      }
    })

    return res.json({
      orderId: session.id,
      total: (session.amount_total || 0) / 100,
      customerEmail: session.customer_email || '',
      customerName: session.metadata?.customerName || '',
      items,
    })
  } catch (e) {
    console.error('Session retrieve error:', e.message)
    return res.status(500).json({ error: 'Failed to retrieve session' })
  }
})

export default router
