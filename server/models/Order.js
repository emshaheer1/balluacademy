import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
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
    return ret
  },
})

export default mongoose.model('Order', orderSchema)
