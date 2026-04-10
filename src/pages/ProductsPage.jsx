import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useFavourites } from '../context/FavouritesContext'
import { getAllProducts } from '../data/products'
import ProductCard from '../components/ProductCard'
import ProductDetailsModal from '../components/ProductDetailsModal'

function matchProduct(product, q) {
  if (!q || !q.trim()) return true
  const term = q.trim().toLowerCase()
  const name = (product.name || '').toLowerCase()
  const sub = (product.subcategory || '').toLowerCase()
  const cat = (product.category || '').toLowerCase()
  const desc = (product.description || '').toLowerCase()
  const path = (product.sectionPath || '').toLowerCase()
  const st = (product.storeType || '').toLowerCase()
  const catShort = String(product.categoryShort || '').toLowerCase()
  const secShort = String(product.sectionTitleShort || '').toLowerCase()
  return (
    name.includes(term)
    || sub.includes(term)
    || cat.includes(term)
    || desc.includes(term)
    || path.includes(term)
    || st.includes(term)
    || catShort.includes(term)
    || secShort.includes(term)
  )
}

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'tshirts', label: 'T-Shirts' },
  { id: 'crop', label: 'Crop T-shirts' },
]

function productMatchesCategory(product, categoryId) {
  if (!categoryId || categoryId === 'all') return true
  const st = product.storeType
  if (categoryId === 'hoodies') return st === 'hoodies'
  if (categoryId === 'shorts') return st === 'shorts'
  if (categoryId === 'tshirts') return st === 'tshirts'
  if (categoryId === 'crop') return st === 'crop'
  return true
}

/** Section / pill label: clearer than raw category for crop lines. */
function sectionCategoryHeading(items) {
  const p = items?.[0]
  if (!p) return 'Shop'
  if (p.storeType === 'crop') return 'Crop tops'
  return p.category || 'Shop'
}

/** Group by folder path so each public subfolder is its own section. */
function groupProductsBySection(productList) {
  const map = new Map()
  for (const p of productList) {
    const key = `${p.gender}|||${p.sectionPath}`
    if (!map.has(key)) {
      map.set(key, {
        gender: p.gender,
        sectionPath: p.sectionPath,
        sectionTitle: p.sectionTitle,
        sectionTitleShort: p.sectionTitleShort,
        sectionSlug: p.sectionSlug,
        items: [],
      })
    }
    map.get(key).items.push(p)
  }
  const rows = [...map.values()]
  rows.forEach((g) => g.items.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })))
  rows.sort((a, b) => (a.sectionTitleShort || '').localeCompare(b.sectionTitleShort || '', undefined, { sensitivity: 'base' }))
  return rows
}

function renderProductGrid(products, findInCart, setSelectedProduct, addToCart, isFavourite, toggleFavourite) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          inCartQty={findInCart(product.id)}
          onViewDetails={setSelectedProduct}
          onAddToCart={(p) => addToCart(p, 1)}
          isFavourite={isFavourite(product.id)}
          onToggleFavourite={() => toggleFavourite(product)}
        />
      ))}
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { cart, addToCart } = useCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const location = useLocation()

  useEffect(() => {
    setProducts(getAllProducts())
    setLoading(false)
  }, [])

  useEffect(() => {
    const hash = (location.hash || '').replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }, [location.hash, products])

  const findInCart = (id) =>
    cart.filter((i) => i.productId === id).reduce((sum, i) => sum + (i.quantity || 0), 0)
  const searchTrimmed = searchQuery.trim()
  const searchResults = searchTrimmed ? products.filter((p) => matchProduct(p, searchTrimmed)) : []
  const categoryFilteredProducts = products.filter((p) => productMatchesCategory(p, categoryFilter))
  const mensProducts = categoryFilteredProducts.filter((p) => p.gender === 'mens')
  const womensProducts = categoryFilteredProducts.filter((p) => p.gender === 'womens')
  const showCategoryFilterView = !searchTrimmed && categoryFilter !== 'all'
  const categoryFilterResults = showCategoryFilterView ? categoryFilteredProducts : []

  const mensGroups = useMemo(() => groupProductsBySection(mensProducts), [mensProducts])
  const womensGroups = useMemo(() => groupProductsBySection(womensProducts), [womensProducts])
  const searchGroups = useMemo(() => groupProductsBySection(searchResults), [searchResults])
  const filterGroups = useMemo(() => groupProductsBySection(categoryFilterResults), [categoryFilterResults])

  const renderSectionGroups = (gender, groups) => (
    <section className="products-category-section products-gender-block" id={gender}>
      <h2 className="products-category-title">{gender === 'mens' ? "Men's" : "Women's"}</h2>
      <p className="products-gender-sub">
        {gender === 'mens' ? "Men's collections" : "Women's collections"} — organized by line.
      </p>
      {groups.map((g) => {
        const lineCategory = sectionCategoryHeading(g.items)
        return (
        <div key={g.sectionSlug} id={g.sectionSlug} className="products-store-section">
          <div className="products-store-section-head">
            <div className="products-store-section-titles">
              <p className="products-store-category-heading">{lineCategory}</p>
              <h3 className="products-subcategory-title">{g.sectionTitleShort}</h3>
            </div>
            <div className="products-store-section-meta">
              <span className="products-section-count">{g.items.length} items</span>
            </div>
          </div>
          {renderProductGrid(g.items, findInCart, setSelectedProduct, addToCart, isFavourite, toggleFavourite)}
        </div>
        )
      })}
    </section>
  )

  return (
    <main className="products-page">
      <section className="products-hero">
        <div className="container">
          <h1>All Products</h1>
          <p className="products-hero-sub">
            Men&apos;s and women&apos;s lines, grouped for quick browsing.
          </p>
          <div className="products-search-wrap">
            <Search size={20} strokeWidth={2} className="products-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="products-search-input"
              placeholder="Search by name, collection, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
              autoComplete="off"
            />
          </div>
          <div className="products-category-filters">
            {CATEGORY_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`products-category-filter-btn ${categoryFilter === id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading products...</div>
      ) : searchTrimmed ? (
        <div className="container products-categories">
          <section className="products-category-section products-search-results">
            <h2 className="products-category-title">
              Search results {searchResults.length > 0 && `(${searchResults.length})`}
            </h2>
            {searchResults.length > 0 ? (
              searchGroups.map((g) => (
                <div key={g.sectionSlug} id={g.sectionSlug} className="products-store-section">
                  <div className="products-store-section-head">
                    <div className="products-store-section-titles">
                      <p className="products-store-category-heading">{sectionCategoryHeading(g.items)}</p>
                      <h3 className="products-subcategory-title">{g.sectionTitleShort}</h3>
                    </div>
                    <span className="products-section-count">{g.items.length} items</span>
                  </div>
                  {renderProductGrid(g.items, findInCart, setSelectedProduct, addToCart, isFavourite, toggleFavourite)}
                </div>
              ))
            ) : (
              <p className="products-search-empty">No products match &quot;{searchTrimmed}&quot;. Try a different term.</p>
            )}
          </section>
        </div>
      ) : showCategoryFilterView ? (
        <div className="container products-categories">
          <section className="products-category-section products-search-results">
            <h2 className="products-category-title">
              {CATEGORY_FILTERS.find((f) => f.id === categoryFilter)?.label} ({categoryFilterResults.length})
            </h2>
            {categoryFilterResults.length > 0 ? (
              filterGroups.map((g) => (
                <div key={g.sectionSlug} className="products-store-section">
                  <div className="products-store-section-head">
                    <div className="products-store-section-titles">
                      <p className="products-store-category-heading">{sectionCategoryHeading(g.items)}</p>
                      <h3 className="products-subcategory-title">{g.sectionTitleShort}</h3>
                    </div>
                    <span className="products-section-count">{g.items.length} items</span>
                  </div>
                  {renderProductGrid(g.items, findInCart, setSelectedProduct, addToCart, isFavourite, toggleFavourite)}
                </div>
              ))
            ) : (
              <p className="products-search-empty">No products in this category.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="container products-categories">
          {renderSectionGroups('mens', mensGroups)}
          {renderSectionGroups('womens', womensGroups)}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p, qty, size, color) => addToCart(p, qty ?? 1, size, color)}
        />
      )}
    </main>
  )
}
