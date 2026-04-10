import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// Admin sign up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!email?.trim() || !password) return res.status(400).json({ error: 'Email and password required' })
    const existing = await Admin.findOne({ email: email.trim().toLowerCase() })
    if (existing) return res.status(400).json({ error: 'Admin with this email already exists' })
    const hashed = await bcrypt.hash(password, 10)
    const admin = await Admin.create({
      name: (name || email.split('@')[0] || 'Admin').trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
    })
    const token = jwt.sign({ adminId: admin._id.toString() }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({ admin: admin.toJSON(), token })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Sign up failed' })
  }
})

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email?.trim() || !password) return res.status(400).json({ error: 'Email and password required' })
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() })
    if (!admin) return res.status(401).json({ error: 'Invalid email or password' })
    const ok = await bcrypt.compare(password, admin.password)
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' })
    const token = jwt.sign({ adminId: admin._id.toString() }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ admin: admin.toJSON(), token })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Login failed' })
  }
})

export default router
