import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const admin = await Admin.findById(decoded.adminId).select('-password')
    if (!admin) return res.status(401).json({ error: 'Unauthorized' })
    req.admin = admin
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
