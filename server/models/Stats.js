import mongoose from 'mongoose'

const statsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'ballu-stats' },
    totalVisits: { type: Number, default: 0 },
    lastVisitAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const STATS_ID = 'ballu-stats'

export async function getOrCreateStats() {
  let doc = await mongoose.model('Stats').findById(STATS_ID)
  if (!doc) {
    doc = await mongoose.model('Stats').create({ _id: STATS_ID, totalVisits: 0 })
  }
  return doc
}

export default mongoose.model('Stats', statsSchema)
