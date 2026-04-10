import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import customersRoutes from './routes/customers.js'
import ordersRoutes from './routes/orders.js'
import statsRoutes from './routes/stats.js'
import contactRoutes from './routes/contact.js'
import adminAuthRoutes from './routes/adminAuth.js'
import adminDataRoutes from './routes/adminData.js'
import stripeRoutes from './routes/stripe.js'

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ballu'

const app = express()
app.use(cors({ origin: true, credentials: true }))

// Stripe webhook needs the raw body for signature verification — must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '5mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/admin', adminAuthRoutes)
app.use('/api/admin', adminDataRoutes)
app.use('/api/stripe', stripeRoutes)

app.get('/', (req, res) => res.json({ message: 'Ball U Academy API', docs: 'Use /api/* endpoints. Health: GET /api/health' }))
app.get('/api/health', (req, res) => res.json({ ok: true }))

// 404 for API – the website runs on the frontend dev server (e.g. port 5173), not here
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'This is the API server. Open the website at http://localhost:5173 (or your frontend URL).' })
})

async function start() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected')
  } catch (e) {
    console.error('MongoDB connection failed:', e.message)
    process.exit(1)
  }
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`))
}

start()
