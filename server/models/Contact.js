import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
  },
  { timestamps: true }
)

contactSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    ret.submittedAt = ret.createdAt
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Contact', contactSchema)
