import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-content">
        <h1>Page not found</h1>
        <p>The page you’re looking for doesn’t exist or has been moved.</p>
        <Link to="/" className="btn-primary">Go to home</Link>
      </div>
    </main>
  )
}
