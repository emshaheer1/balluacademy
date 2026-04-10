import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const FAV_KEY = 'ballu-favourites'
const FavouritesContext = createContext(null)

export function FavouritesProvider({ children }) {
  const { user } = useAuth()
  const [favourites, setFavourites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favourites))
    } catch (e) {}
  }, [favourites])

  // Clear favourites in memory when user logs out
  useEffect(() => {
    if (!user) setFavourites([])
  }, [user])

  const isFavourite = useCallback((productId) => {
    return favourites.some((f) => f.id === productId)
  }, [favourites])

  const toggleFavourite = useCallback((product) => {
    setFavourites((prev) => {
      const exists = prev.find((f) => f.id === product.id)
      if (exists) return prev.filter((f) => f.id !== product.id)
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, category: product.category }]
    })
  }, [])

  const removeFavourite = useCallback((productId) => {
    setFavourites((prev) => prev.filter((f) => f.id !== productId))
  }, [])

  return (
    <FavouritesContext.Provider value={{ favourites, isFavourite, toggleFavourite, removeFavourite }}>
      {children}
    </FavouritesContext.Provider>
  )
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext)
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider')
  return ctx
}
