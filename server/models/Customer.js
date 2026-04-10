import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    address: {
      address: { type: String, default: '' },
      country: { type: String, default: '' },
      code: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

customerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Customer', customerSchema)
