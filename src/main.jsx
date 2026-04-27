import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './redesign-additions.css'

function routerBasename() {
  const b = import.meta.env.BASE_URL ?? '/'
  if (!b || b === '/' || b === './') return undefined
  return b.replace(/\/$/, '') || undefined
}

const KEY = 'felicia-theme'
function getPreferred() {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'dark' || stored === 'light') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch (e) {}
  return 'light'
}
document.documentElement.setAttribute('data-theme', getPreferred())

if (typeof window !== 'undefined' && window.history?.scrollRestoration) {
  window.history.scrollRestoration = 'manual'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
