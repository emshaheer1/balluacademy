import { createContext, useContext } from 'react'

const OpenCartContext = createContext(() => {})

export function OpenCartProvider({ openCart, children }) {
  return (
    <OpenCartContext.Provider value={openCart}>
      {children}
    </OpenCartContext.Provider>
  )
}

export function useOpenCart() {
  return useContext(OpenCartContext)
}
