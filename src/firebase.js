import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyB1VQBuorWLEDeFBVWJlMo2StofKM5NNno',
  authDomain: 'ecommerce-89ecf.firebaseapp.com',
  projectId: 'ecommerce-89ecf',
  storageBucket: 'ecommerce-89ecf.firebasestorage.app',
  messagingSenderId: '1062373704927',
  appId: '1:1062373704927:web:8c3d697c65556678b4156a',
  measurementId: 'G-P12ZJW6XJ7',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export { signInWithPopup, signInWithRedirect, getRedirectResult }

let analytics = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (e) {}
}
export { analytics }
