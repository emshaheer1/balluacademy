import { Router } from 'express'
import Contact from '../models/Contact.js'

const router = Router()

// GET so the route is registered; actual submit is POST only
router.get('/', (req, res) => {
  res.set('Allow', 'POST')
  res.status(405).json({ error: 'Method not allowed', message: 'Use POST to submit the contact form.' })
})

// Submit contact form (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email and message are required' })
    }
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: (subject || '').trim(),
      message: message.trim(),
    })
    const data = contact.toJSON()
    data.submittedAt = contact.createdAt
    return res.status(201).json(data)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to submit message' })
  }
})

export default router
