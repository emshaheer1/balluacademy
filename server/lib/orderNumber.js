import crypto from 'crypto'

/** Stripe Checkout Session ids always start with `cs_`. */
export function isStripeCheckoutSessionId(s) {
  const t = String(s || '').trim()
  return t.startsWith('cs_') && t.length > 12
}

/** Customer-facing id like `BU-48291` (unique in `orders.orderId`). */
export async function generateUniqueBuOrderId(OrderModel, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const n = crypto.randomInt(0, 100000)
    const id = `BU-${String(n).padStart(5, '0')}`
    const exists = await OrderModel.exists({ orderId: id })
    if (!exists) return id
  }
  const id = `BU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  if (await OrderModel.exists({ orderId: id })) {
    throw new Error('Could not allocate unique order number')
  }
  return id
}
