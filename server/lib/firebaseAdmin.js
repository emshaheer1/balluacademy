import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let auth = null

export function getFirebaseAuth() {
  if (auth) return auth
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyPath) {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS not set; Google sign-in will be disabled.')
    return null
  }
  try {
    if (!admin.apps.length) {
      const key = JSON.parse(readFileSync(resolve(keyPath), 'utf8'))
      admin.initializeApp({ credential: admin.credential.cert(key) })
    }
    auth = admin.auth()
    return auth
  } catch (e) {
    console.warn('Firebase Admin init failed:', e.message)
    return null
  }
}
