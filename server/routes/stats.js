import { Router } from 'express'
import { getOrCreateStats } from '../models/Stats.js'

const router = Router()

// Record a visit (called from store frontend on each load)
router.post('/visit', async (req, res) => {
  try {
    const stats = await getOrCreateStats()
    stats.totalVisits = (stats.totalVisits || 0) + 1
    stats.lastVisitAt = new Date()
    await stats.save()
    return res.json({ totalVisits: stats.totalVisits })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to record visit' })
  }
})

// Get stats (used by admin dashboard)
router.get('/', async (req, res) => {
  try {
    const stats = await getOrCreateStats()
    return res.json({
      totalVisits: stats.totalVisits || 0,
      lastVisitAt: stats.lastVisitAt,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
