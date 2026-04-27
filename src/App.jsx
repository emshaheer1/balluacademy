import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { FavouritesProvider } from './context/FavouritesContext'
import { OrdersProvider } from './context/OrdersContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductQuickReviewPage from './pages/ProductQuickReviewPage'
import CartPage from './pages/CartPage'
import CheckoutAuthPage from './pages/CheckoutAuthPage'
import CheckoutPage from './pages/CheckoutPage'
import ContactPage from './pages/ContactPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminSignupPage from './pages/admin/AdminSignupPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import CheckoutCancelPage from './pages/CheckoutCancelPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <FavouritesProvider>
            <OrdersProvider>
              <CartProvider>
                <Routes>
                  <Route path="/" element={<Layout><HomePage /></Layout>} />
                  <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
                  <Route path="/products/:gender/:collection" element={<Layout><ProductsPage /></Layout>} />
                  <Route path="/quick-review/:productId" element={<Layout><ProductQuickReviewPage /></Layout>} />
                  <Route path="/cart" element={<Layout><CartPage /></Layout>} />
                  <Route path="/checkout-auth" element={<Layout><CheckoutAuthPage /></Layout>} />
                  <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                  <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
                  <Route path="/admin" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
                  <Route path="/admin/login" element={<AdminLayout><AdminLoginPage /></AdminLayout>} />
                  <Route path="/admin/signup" element={<AdminLayout><AdminSignupPage /></AdminLayout>} />
                  <Route path="/checkout/success" element={<Layout><CheckoutSuccessPage /></Layout>} />
                  <Route path="/checkout/cancel" element={<Layout><CheckoutCancelPage /></Layout>} />
                  <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                </Routes>
              </CartProvider>
            </OrdersProvider>
          </FavouritesProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
