import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Users, ShoppingBag, ClipboardList, MessageSquare, Sun, Moon, Truck, CheckCircle2 } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { useTheme } from '../../context/ThemeContext'
import { apiWithAuth } from '../../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const ICON_SIZE = 20

function lineItemKey(orderId, item, index) {
  return `${orderId}-${item.productId || 'x'}-${item.size || ''}-${item.color || ''}-${index}`
}

function OrderLineImage({ src, alt }) {
  const [broken, setBroken] = useState(!src)
  useEffect(() => {
    setBroken(!src)
  }, [src])
  if (broken || !src) {
    return (
      <div className="admin-order-product-thumb admin-order-product-thumb--placeholder" aria-hidden>
        —
      </div>
    )
  }
  return (
    <img
      className="admin-order-product-thumb"
      src={src}
      alt={alt || ''}
      onError={() => setBroken(true)}
    />
  )
}
const SECTIONS = [
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'customers', label: 'Customer accounts', Icon: Users },
  { id: 'orders', label: 'Orders', Icon: ShoppingBag },
  { id: 'order-details', label: 'Order details', Icon: ClipboardList },
  { id: 'orders-dispatched', label: 'Orders dispatched', Icon: Truck },
  { id: 'customer-details', label: 'Customer details', Icon: ClipboardList },
  { id: 'contacts', label: 'Contact page requests', Icon: MessageSquare },
]

export default function AdminDashboardPage() {
  const { admin, adminLogout } = useAdmin()
  const { theme, toggle } = useTheme()
  const [activeSection, setActiveSection] = useState('analytics')
  const [refreshKey, setRefreshKey] = useState(0)
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [contacts, setContacts] = useState([])
  const [stats, setStats] = useState({ totalVisits: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailOrderId, setDetailOrderId] = useState(null)
  const [dispatchingOrderId, setDispatchingOrderId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      apiWithAuth('api/admin/customers'),
      apiWithAuth('api/admin/orders'),
      apiWithAuth('api/admin/contacts'),
      apiWithAuth('api/admin/stats'),
    ])
      .then(([customersList, ordersList, contactsList, statsData]) => {
        if (!cancelled) {
          setCustomers(Array.isArray(customersList) ? customersList : [])
          setOrders(Array.isArray(ordersList) ? ordersList : [])
          setContacts(Array.isArray(contactsList) ? contactsList : [])
          setStats(statsData || { totalVisits: 0 })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load dashboard data')
          setCustomers([])
          setOrders([])
          setContacts([])
          setStats({ totalVisits: 0 })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [refreshKey])

  const { chartData, ordersByCustomer } = useMemo(() => {
    const totalVisits = stats.totalVisits || 0
    const totalOrders = orders.length
    const usersWhoOrdered = new Set(orders.map((o) => o.customerEmail).filter(Boolean)).size
    const ordersByCustomerMap = {}
    orders.forEach((o) => {
      const email = o.customerEmail || '—'
      if (!ordersByCustomerMap[email]) ordersByCustomerMap[email] = []
      ordersByCustomerMap[email].push(o)
    })
    const chartData = [
      { name: 'Website visits', value: totalVisits },
      { name: 'Total orders', value: totalOrders },
      { name: 'Customers who ordered', value: usersWhoOrdered },
    ]
    return { chartData, ordersByCustomer: ordersByCustomerMap }
  }, [stats.totalVisits, orders])

  const detailOrder = useMemo(
    () => (detailOrderId ? orders.find((o) => o.orderId === detailOrderId) : null),
    [orders, detailOrderId]
  )
  const pendingOrders = useMemo(() => orders.filter((o) => !o.dispatched), [orders])
  const dispatchedOrders = useMemo(() => orders.filter((o) => o.dispatched), [orders])

  const toggleOrderDetail = useCallback((orderId) => {
    setDetailOrderId((current) => (current === orderId ? null : orderId))
  }, [])

  const handleDispatchOrder = useCallback(async (orderId) => {
    if (!orderId) return
    setDispatchingOrderId(orderId)
    setError(null)
    try {
      const updated = await apiWithAuth(`api/admin/orders/${encodeURIComponent(orderId)}/dispatch`, {
        method: 'PATCH',
      })
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, ...updated } : o)))
    } catch (err) {
      setError(err?.message || 'Failed to mark order as dispatched')
    } finally {
      setDispatchingOrderId(null)
    }
  }, [])

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-brand">
          <Link to="/">Ball U Academy</Link>
          <span className="admin-dash-sep">/</span>
          <span>Admin</span>
        </div>
        <div className="admin-dashboard-user">
          <button type="button" className="admin-theme-toggle admin-theme-toggle-header" aria-label="Toggle dark mode" onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun size={ICON_SIZE} strokeWidth={2} /> : <Moon size={ICON_SIZE} strokeWidth={2} />}
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>Refresh</button>
          <span className="admin-dash-name">{admin?.name || admin?.email}</span>
          <Link to="/admin/login" className="btn-ghost btn-sm" onClick={adminLogout}>Log out</Link>
        </div>
      </header>

      <div className="admin-dashboard-layout">
        <aside className="admin-dashboard-sidebar">
          <nav className="admin-dashboard-nav">
            {SECTIONS.map((s) => {
              const Icon = s.Icon
              return (
                <button key={s.id} type="button" className={`admin-dashboard-nav-item ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
                  <Icon size={ICON_SIZE} strokeWidth={2} className="admin-nav-icon" />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="admin-dashboard-main">
          {error && <p className="admin-auth-error" style={{ marginBottom: '1rem' }}>{error}</p>}
          {loading && !customers.length && !orders.length ? (
            <p className="admin-section-sub">Loading dashboard…</p>
          ) : (
            <>
              {activeSection === 'analytics' && (
                <>
                  <h1 className="admin-section-title">Analytics</h1>
                  <p className="admin-dash-sub">Overview of site activity and metrics.</p>
                  <section className="admin-stats-cards">
              <div className="admin-stat-card">
                <span className="admin-stat-value">{stats.totalVisits ?? 0}</span>
                <span className="admin-stat-label">Website visits</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{orders.length}</span>
                <span className="admin-stat-label">Total orders</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{new Set(orders.map((o) => o.customerEmail).filter(Boolean)).size}</span>
                <span className="admin-stat-label">Customers who ordered</span>
              </div>
              <div className="admin-stat-card">
                    <span className="admin-stat-value">{customers.length}</span>
                    <span className="admin-stat-label">Registered users</span>
                  </div>
                  </section>
                  <section className="admin-chart-section">
                    <h2>Overview</h2>
                    <div className="admin-chart-wrap">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                          <Tooltip contentStyle={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="value" name="Count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </>
              )}

              {activeSection === 'customers' && (
                <section className="admin-customers-section">
                  <h1 className="admin-section-title">Customer accounts</h1>
                  <p className="admin-section-sub">Registered users who have signed up on the website.</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Profile</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Orders</th>
                          <th>Signed up</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="admin-table-empty">No customers yet.</td>
                          </tr>
                        ) : (
                          customers.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="admin-cell-avatar">
                                  {c.avatarUrl ? (
                                    <img src={c.avatarUrl} alt="" />
                                  ) : (
                                    <span>{c.name ? c.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'}</span>
                                  )}
                                </div>
                              </td>
                              <td>{c.name || '—'}</td>
                              <td>{c.email || '—'}</td>
                              <td>{(ordersByCustomer[c.email] || []).length}</td>
                              <td>{c.signedUpAt ? new Date(c.signedUpAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeSection === 'orders' && (
                <section className="admin-orders-section">
                  <h1 className="admin-section-title">Orders</h1>
                  <p className="admin-section-sub">Overview of all orders placed by customers.</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Email</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="admin-table-empty">No orders yet.</td>
                          </tr>
                        ) : (
                          orders.slice(0, 50).map((order) => (
                            <tr key={order.orderId}>
                              <td><code>{order.orderId}</code></td>
                              <td>{order.customerName || '—'}</td>
                              <td>{order.customerEmail || '—'}</td>
                              <td>{order.items?.length ?? 0}</td>
                              <td>${Number(order.total ?? 0).toFixed(2)}</td>
                              <td>{order.date ? new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}</td>
                              <td>{order.dispatched ? 'Dispatched' : 'Pending'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeSection === 'order-details' && (
                <section className="admin-orders-section">
                  <h1 className="admin-section-title">Order details</h1>
                  <p className="admin-section-sub">View pending orders and inspect every line item before dispatching.</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer name</th>
                          <th>Email</th>
                          <th>Quantity</th>
                          <th>View details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="admin-table-empty">No pending orders.</td>
                          </tr>
                        ) : (
                          pendingOrders.slice(0, 100).map((order) => (
                            <tr key={order.orderId}>
                              <td><code>{order.orderId}</code></td>
                              <td>{order.customerName || '—'}</td>
                              <td>{order.customerEmail || '—'}</td>
                              <td>{order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-order-detail-btn"
                                  aria-expanded={detailOrderId === order.orderId}
                                  onClick={() => toggleOrderDetail(order.orderId)}
                                >
                                  {detailOrderId === order.orderId ? 'Hide details' : 'View details'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {detailOrder && (
                    <div className="admin-order-details-panel">
                      <h2 className="admin-order-details-title">Order #{detailOrder.orderId}</h2>
                      <div className="admin-order-details-meta">
                        <div>
                          <span className="admin-order-details-label">Customer</span>
                          <span className="admin-order-details-value">{detailOrder.customerName || '—'}</span>
                        </div>
                        <div>
                          <span className="admin-order-details-label">Email</span>
                          <span className="admin-order-details-value">{detailOrder.customerEmail || '—'}</span>
                        </div>
                        <div>
                          <span className="admin-order-details-label">Order date</span>
                          <span className="admin-order-details-value">
                            {detailOrder.date ? new Date(detailOrder.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="admin-table-wrap admin-order-details-table-wrap">
                        <table className="admin-table admin-order-line-items">
                          <thead>
                            <tr>
                              <th className="admin-order-col-image">Product image</th>
                              <th>Category</th>
                              <th>Product title</th>
                              <th>Size</th>
                              <th>Color</th>
                              <th>Price</th>
                              <th>Qty</th>
                              <th>Line total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(!detailOrder.items || detailOrder.items.length === 0) ? (
                              <tr>
                                <td colSpan={8} className="admin-table-empty">No line items on this order.</td>
                              </tr>
                            ) : (
                              detailOrder.items.map((item, index) => (
                                <tr key={lineItemKey(detailOrder.orderId, item, index)}>
                                  <td className="admin-order-col-image">
                                    <OrderLineImage src={item.image} alt={item.name} />
                                  </td>
                                  <td>{item.category || '—'}</td>
                                  <td>{item.name || '—'}</td>
                                  <td>{item.size || '—'}</td>
                                  <td>{item.color || '—'}</td>
                                  <td>${Number(item.price || 0).toFixed(2)}</td>
                                  <td>{item.quantity ?? '—'}</td>
                                  <td>${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="admin-order-details-footer">
                        <div className="admin-order-grand-total">
                          Total price: <strong>${Number(detailOrder.total ?? 0).toFixed(2)}</strong>
                        </div>
                        {detailOrder.dispatched ? (
                          <span className="admin-dispatched-chip" title="Order dispatched">
                            <CheckCircle2 size={16} strokeWidth={2} />
                            Dispatched
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary admin-dispatch-btn"
                            onClick={() => handleDispatchOrder(detailOrder.orderId)}
                            disabled={dispatchingOrderId === detailOrder.orderId}
                          >
                            {dispatchingOrderId === detailOrder.orderId ? 'Saving...' : 'Dispatched to customer'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {activeSection === 'orders-dispatched' && (
                <section className="admin-orders-section">
                  <h1 className="admin-section-title">Orders dispatched</h1>
                  <p className="admin-section-sub">Confirmed dispatched orders are stored here.</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Email</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Dispatched at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatchedOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="admin-table-empty">No dispatched orders yet.</td>
                          </tr>
                        ) : (
                          dispatchedOrders.map((order) => (
                            <tr key={order.orderId}>
                              <td><code>{order.orderId}</code></td>
                              <td>{order.customerName || '—'}</td>
                              <td>{order.customerEmail || '—'}</td>
                              <td>{order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</td>
                              <td>${Number(order.total ?? 0).toFixed(2)}</td>
                              <td>{order.dispatchedAt ? new Date(order.dispatchedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeSection === 'contacts' && (
                <section className="admin-contacts-section">
                  <h1 className="admin-section-title">Contact page requests</h1>
                  <p className="admin-section-sub">Messages submitted via the Contact Us form.</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table admin-table-contacts">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Subject</th>
                          <th>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="admin-table-empty">No contact requests yet.</td>
                          </tr>
                        ) : (
                          contacts.map((c) => (
                            <tr key={c.id}>
                              <td>{c.submittedAt ? new Date(c.submittedAt).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}</td>
                              <td>{c.name || '—'}</td>
                              <td>{c.email || '—'}</td>
                              <td>{c.subject || '—'}</td>
                              <td className="admin-contact-message">{c.message || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeSection === 'customer-details' && (
                <section className="admin-customers-section">
                  <h1 className="admin-section-title">Customer details</h1>
                  <p className="admin-section-sub">Full details of registered customers including address.</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Profile</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Address</th>
                          <th>Orders</th>
                          <th>Signed up</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="admin-table-empty">No customers yet.</td>
                          </tr>
                        ) : (
                          customers.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="admin-cell-avatar">
                                  {c.avatarUrl ? (
                                    <img src={c.avatarUrl} alt="" />
                                  ) : (
                                    <span>{c.name ? c.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'}</span>
                                  )}
                                </div>
                              </td>
                              <td>{c.name || '—'}</td>
                              <td>{c.email || '—'}</td>
                              <td>{[c.address?.address, c.address?.country, c.address?.code].filter(Boolean).join(', ') || '—'}</td>
                              <td>{(ordersByCustomer[c.email] || []).length}</td>
                              <td>{c.signedUpAt ? new Date(c.signedUpAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
