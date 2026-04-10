import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let auth = null

function loadServiceAccountKey() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (inline?.trim()) {
    return JSON.parse(inline.trim())
  }
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (keyPath) {
    return JSON.parse(readFileSync(resolve(keyPath), 'utf8'))
  }
  return null
}

export function getFirebaseAuth() {
  if (auth) return auth
  try {
    if (!admin.apps.length) {
      const key = loadServiceAccountKey()
      if (!key) {
        console.warn(
          'Firebase Admin not configured (set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS); Google sign-in verification will be disabled.'
        )
        return null
      }
      admin.initializeApp({ credential: admin.credential.cert(key) })
    }
    auth = admin.auth()
    return auth
  } catch (e) {
    console.warn('Firebase Admin init failed:', e.message)
    return null
  }
}
