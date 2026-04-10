import { Router } from 'express'
import Customer from '../models/Customer.js'

const router = Router()

// Update customer profile (address or avatar/name) by email (no auth for simplicity; in production use JWT)
router.patch('/profile', async (req, res) => {
  try {
    const { email, address, name, avatarUrl } = req.body
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
    const customer = await Customer.findOne({ email: email.trim().toLowerCase() })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    if (address && typeof address === 'object') {
      customer.address = { ...customer.address, ...address }
    }
    if (name !== undefined) customer.name = name
    if (avatarUrl !== undefined) customer.avatarUrl = avatarUrl
    await customer.save()
    const user = customer.toJSON()
    user.signedUpAt = customer.createdAt
    return res.json({ user })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Update failed' })
  }
})

export default router
