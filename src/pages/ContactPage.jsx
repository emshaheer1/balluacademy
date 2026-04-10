import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { api } from '../api/client'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSuccess(false)
    if (!form.name?.trim() || !form.email?.trim() || !form.message?.trim()) {
      setMessage('Please fill in name, email and message.')
      return
    }
    setLoading(true)
    try {
      await api('api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      })
      setSuccess(true)
      setShowSuccessModal(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setMessage(err?.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <h1>Get in Touch</h1>
          <p className="contact-hero-sub">Have questions? We'd love to hear from you. Reach out and we'll respond as soon as possible.</p>
        </div>
      </section>
      <section className="contact-main section">
        <div className="container">
          <div className="contact-layout">
            <div className="contact-details-card">
              <h2>Contact Information</h2>
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <span className="contact-icon">✉</span>
                  <div>
                    <span className="contact-label">Email</span>
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=balluacademy%40gmail.com"
                      target="_blank"
                      rel="noreferrer"
                    >
                      balluacademy@gmail.com
                    </a>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-icon">🕐</span>
                  <div>
                    <span className="contact-label">Business Hours</span>
                    <span>Monday – Friday, 9am – 5pm (USA)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-form-card">
              <h2>Send us a message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="contact-name">Name*</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="contact-email">Email*</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="contact-message">Message*</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Your message..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Send message'}</button>
                {message && !showSuccessModal && <div className={`contact-form-message ${success ? 'success' : ''}`}>{message}</div>}
              </form>
            </div>
          </div>
        </div>
      </section>

      {showSuccessModal && (
        <>
          <div className="modal-backdrop visible" onClick={() => setShowSuccessModal(false)} aria-hidden="true" />
          <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="contact-success-title">
            <div className="modal-inner info-modal-inner contact-success-modal-inner">
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowSuccessModal(false)}><X size={20} strokeWidth={2} /></button>
              <div className="info-modal-content contact-success-content">
                <div className="contact-success-tick-wrap">
                  <div className="contact-success-tick-circle">
                    <Check size={36} strokeWidth={2.5} className="contact-success-tick-icon" aria-hidden="true" />
                  </div>
                </div>
                <h2 id="contact-success-title">Request received</h2>
                <p className="info-modal-message">
                  Your request is received. Ball U Academy team will contact you in a short time.
                </p>
                <button type="button" className="btn-primary" onClick={() => setShowSuccessModal(false)}>OK</button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
