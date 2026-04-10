import { Router } from 'express'
import bcrypt from 'bcryptjs'
import Customer from '../models/Customer.js'
import { getFirebaseAuth } from '../lib/firebaseAdmin.js'

const router = Router()
const GOOGLE_PLACEHOLDER_PASSWORD = 'google-sign-in-placeholder'

// Customer sign up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
    const displayName = (name || email.split('@')[0] || 'Customer').trim()
    const hashed = await bcrypt.hash(password || 'default', 10)
    const existing = await Customer.findOne({ email: email.trim().toLowerCase() })
    if (existing) {
      const user = existing.toJSON()
      user.address = user.address || {}
      return res.json({ user })
    }
    const customer = await Customer.create({
      name: displayName,
      email: email.trim().toLowerCase(),
      password: hashed,
      address: {},
    })
    const user = customer.toJSON()
    user.signedUpAt = customer.createdAt
    return res.status(201).json({ user })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Sign up failed' })
  }
})

// Google sign-in: verify Firebase idToken, find or create customer
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ error: 'idToken is required' })
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) {
      return res.status(503).json({ error: 'Google sign-in is not configured. Set GOOGLE_APPLICATION_CREDENTIALS.' })
    }
    const decoded = await firebaseAuth.verifyIdToken(idToken)
    const email = (decoded.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Google account has no email' })
    const name = (decoded.name || decoded.email?.split('@')[0] || 'Customer').trim()
    const avatarUrl = decoded.picture || null

    let customer = await Customer.findOne({ email })
    if (!customer) {
      const hashed = await bcrypt.hash(GOOGLE_PLACEHOLDER_PASSWORD, 10)
      customer = await Customer.create({
        name,
        email,
        password: hashed,
        avatarUrl,
        address: {},
      })
    } else {
      if (avatarUrl && !customer.avatarUrl) {
        customer.avatarUrl = avatarUrl
        await customer.save()
      }
      if (name && !customer.name) {
        customer.name = name
        await customer.save()
      }
    }

    const user = customer.toJSON()
    user.signedUpAt = customer.createdAt
    return res.json({ user })
  } catch (e) {
    console.error('Google auth error:', e)
    if (e.code === 'auth/id-token-expired' || e.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired Google token' })
    }
    return res.status(500).json({ error: 'Google sign-in failed' })
  }
})

// Customer login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
    const customer = await Customer.findOne({ email: email.trim().toLowerCase() })
    if (!customer) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const ok = await bcrypt.compare(password || '', customer.password)
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' })
    const user = customer.toJSON()
    user.signedUpAt = customer.createdAt
    return res.json({ user })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Login failed' })
  }
})

export default router
