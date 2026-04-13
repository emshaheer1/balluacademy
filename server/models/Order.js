import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    /** Stripe Checkout Session id — used for webhooks/refunds; not shown as the customer order number. */
    stripeSessionId: { type: String, default: null, sparse: true, unique: true },
    items: [
      {
        productId: String,
        name: String,
        category: String,
        quantity: Number,
        price: Number,
        size: String,
        color: String,
        image: String,
      },
    ],
    total: { type: Number, required: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    dispatched: { type: Boolean, default: false },
    dispatchedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    ret.date = ret.createdAt
    delete ret._id
    delete ret.__v
    delete ret.createdAt
    delete ret.updatedAt
    delete ret.stripeSessionId
    return ret
  },
})

export default mongoose.model('Order', orderSchema)
