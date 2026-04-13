import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Package, Heart, LogOut, Camera, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { useFavourites } from '../context/FavouritesContext'

const MOBILE_MQ = window.matchMedia('(max-width: 768px)')
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => MOBILE_MQ.matches)
  useEffect(() => {
    const handler = () => setIsMobile(MOBILE_MQ.matches)
    MOBILE_MQ.addEventListener('change', handler)
    return () => MOBILE_MQ.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function formatCurrency(v) {
  return `$${Number(v).toFixed(2)}`
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch (e) {
    return iso
  }
}

/** Short `BU-` ids show in full; legacy Stripe `cs_` ids stay compact. */
function formatOrderRef(orderId) {
  const s = String(orderId || '')
  if (/^BU-/i.test(s)) return `#${s}`
  return `#${s.slice(-8).toUpperCase()}`
}

export default function ProfileDropdown({ onClose, buttonRef }) {
  const { user, logout, updateAddress, updateProfile } = useAuth()
  const { orders } = useOrders()
  const { favourites, removeFavourite } = useFavourites()
  const [section, setSection] = useState(null) // null | 'address' | 'orders' | 'favourites'
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressSaved, setAddressSaved] = useState(false)
  const fileInputRef = useRef(null)
  const [addressForm, setAddressForm] = useState({
    address: user?.address?.address || '',
    country: user?.address?.country || '',
    code: user?.address?.code || '',
  })
  const panelRef = useRef(null)

  useEffect(() => {
    setAddressForm({
      address: user?.address?.address || '',
      country: user?.address?.country || '',
      code: user?.address?.code || '',
    })
  }, [user])

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && buttonRef?.current && !buttonRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose, buttonRef])

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setAddressSaved(false)
    try {
      await updateAddress(addressForm)
      setAddressSaved(true)
      setTimeout(() => setAddressSaved(false), 2000)
    } finally {
      setSavingAddress(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      updateProfile({ avatarUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const initials = user?.name ? user.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const isMobile = useIsMobile()

  const dropdownContent = (
    <div className={`profile-dropdown${isMobile ? ' profile-dropdown--centered' : ''}`} ref={panelRef}>
      <div className="profile-dropdown-header">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" aria-hidden="true">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="profile-avatar-img" /> : initials}
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" className="profile-avatar-input" onChange={handlePhotoChange} aria-label="Upload profile photo" />
          <button type="button" className="profile-avatar-upload" onClick={() => fileInputRef.current?.click()}><Camera size={14} strokeWidth={2} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Change photo</button>
        </div>
        <div className="profile-info">
          <div className="profile-name">{user?.name || 'Customer'}</div>
          <div className="profile-email">{user?.email || ''}</div>
        </div>
      </div>

      <nav className="profile-nav">
        <button type="button" className="profile-nav-item" onClick={() => setSection(section === 'address' ? null : 'address')}>
          <MapPin size={18} strokeWidth={2} className="profile-nav-icon" />
          Address
        </button>
        {section === 'address' && (
          <div className="profile-address-form">
            <form onSubmit={handleSaveAddress}>
              <div className="form-field">
                <label>Address</label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street address"
                />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input
                  type="text"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
              <div className="form-field">
                <label>Postal / Zip code</label>
                <input
                  type="text"
                  value={addressForm.code}
                  onChange={(e) => setAddressForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="Code"
                />
              </div>
              <div className="profile-address-actions">
                <button type="submit" className="btn-primary" disabled={savingAddress}>{savingAddress ? 'Saving…' : 'Save'}</button>
                {addressSaved && <span className="profile-address-saved">Saved</span>}
              </div>
            </form>
          </div>
        )}

        <button type="button" className="profile-nav-item" onClick={() => setSection(section === 'orders' ? null : 'orders')}>
          <Package size={18} strokeWidth={2} className="profile-nav-icon" />
          My orders
        </button>
        {section === 'orders' && (
          <div className="profile-section-content">
            {orders.length === 0 ? (
              <p className="profile-empty">No orders yet.</p>
            ) : (
              <ul className="profile-orders-list">
                {orders.map((order) => (
                  <li key={order.orderId} className="profile-order-item">
                    <div className="profile-order-id">{formatOrderRef(order.orderId)}</div>
                    <div className="profile-order-meta">{formatDate(order.date)} · {order.items?.length || 0} items · {formatCurrency(order.total)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button type="button" className="profile-nav-item" onClick={() => setSection(section === 'favourites' ? null : 'favourites')}>
          <Heart size={18} strokeWidth={2} className="profile-nav-icon" />
          Favourites
        </button>
        {section === 'favourites' && (
          <div className="profile-section-content">
            {favourites.length === 0 ? (
              <p className="profile-empty">No favourites yet.</p>
            ) : (
              <ul className="profile-favourites-list">
                {favourites.map((item) => (
                  <li key={item.id} className="profile-fav-item">
                    <img src={item.image} alt="" className="profile-fav-img" />
                    <div className="profile-fav-info">
                      <span className="profile-fav-name">{item.name}</span>
                      <span className="profile-fav-price">{formatCurrency(item.price)}</span>
                    </div>
                    <button type="button" className="profile-fav-remove" onClick={() => removeFavourite(item.id)} aria-label="Remove"><X size={14} strokeWidth={2} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button type="button" className="profile-nav-item profile-nav-logout" onClick={() => { logout(); onClose(); }}>
          <LogOut size={18} strokeWidth={2} className="profile-nav-icon" />
          Log out
        </button>
      </nav>
    </div>
  )

  if (isMobile) {
    return createPortal(
      <>
        <div className="profile-dropdown-backdrop" aria-hidden="true" onClick={onClose} />
        {dropdownContent}
      </>,
      document.body
    )
  }

  return dropdownContent
}
