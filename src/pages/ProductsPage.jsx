import { useState, useEffect, useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useFavourites } from '../context/FavouritesContext'
import { getAllProducts } from '../data/products'
import { getCollectionDisplayName, matchesCollectionKey } from '../data/productCollections'
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
]

/** Type chips on `/products/womens/all` only — tees and crops are separate. */
const WOMENS_ALL_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'tshirts', label: 'T-Shirts' },
  { id: 'crop', label: 'Crop T-Shirts' },
]

function productMatchesCategory(product, categoryId) {
  if (!categoryId || categoryId === 'all') return true
  const st = product.storeType
  if (categoryId === 'hoodies') return st === 'hoodies'
  if (categoryId === 'shorts') return st === 'shorts'
  if (categoryId === 'tshirts') return st === 'tshirts' || st === 'crop'
  return true
}

function productMatchesWomensAllCategory(product, categoryId) {
  if (!categoryId || categoryId === 'all') return true
  const st = product.storeType
  if (categoryId === 'shorts') return st === 'shorts'
  if (categoryId === 'tshirts') return st === 'tshirts'
  if (categoryId === 'crop') return st === 'crop'
  return false
}

/**
 * Line above the subcategory title — uses the same catalog label as `sectionTitleShort` when available
 * so it matches the nav (U Hoodies, HU Shirt, …). Falls back to broad type for legacy items.
 */
function sectionCategoryHeading(items) {
  const p = items?.[0]
  if (!p) return 'Shop'
  if (p.sectionTitleShort) return p.sectionTitleShort
  const st = p.storeType
  if (st === 'crop') return 'Crop tops'
  if (st === 'hoodies') return 'Hoodies'
  if (st === 'shorts') return 'Shorts'
  if (st === 'tshirts') return 'T-Shirts'
  return 'Shop'
}

function SectionTitleBlock({ items, sectionTitleShort }) {
  const line = sectionCategoryHeading(items)
  const showEyebrow = Boolean(line && line !== sectionTitleShort)
  return (
    <div className="products-store-section-titles">
      {showEyebrow ? <p className="products-store-category-heading">{line}</p> : null}
      <h3 className="products-subcategory-title">{sectionTitleShort}</h3>
    </div>
  )
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

/** Copy for `/products/:gender/:collection` when `collection` is not `all` — type chips live on all-catalog routes. */
function CollectionHeroLede({ routeGender, routeCollection }) {
  const genderWord = routeGender === 'mens' ? "men's" : "women's"
  const line = getCollectionDisplayName(routeCollection)
  return (
    <p className="products-collection-lede">
      You are viewing <strong>{line}</strong> in our {genderWord} range. Everything below belongs to this line—open any item for sizes, materials, and details.
      For <strong>All</strong>, <strong>Hoodies</strong>, <strong>Shorts</strong>, and <strong>T-Shirts</strong> on men&apos;s or women&apos;s full catalogs, open{' '}
      <strong>Products</strong> → <strong>{routeGender === 'mens' ? 'All Mens Products' : 'All Womens Products'}</strong>; women&apos;s full catalog also has <strong>Crop T-Shirts</strong> as its own filter.
    </p>
  )
}

export default function ProductsPage() {
  const { gender: routeGenderRaw, collection: routeCollectionRaw } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { cart, addToCart } = useCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const location = useLocation()
  const routeGender = routeGenderRaw === 'mens' || routeGenderRaw === 'womens' ? routeGenderRaw : null
  const routeCollection = routeCollectionRaw || 'all'
  const isGenderScopedPage = Boolean(routeGender)

  useEffect(() => {
    setProducts(getAllProducts())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isGenderScopedPage) setCategoryFilter('all')
  }, [isGenderScopedPage, routeGender, routeCollection])

  useEffect(() => {
    const hash = (location.hash || '').replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }, [location.hash, products])

  const findInCart = (id) =>
    cart.filter((i) => i.productId === id).reduce((sum, i) => sum + (i.quantity || 0), 0)
  const searchTrimmed = searchQuery.trim()
  const scopedProducts = useMemo(
    () =>
      products
        .filter((p) => (!routeGender ? true : p.gender === routeGender))
        .filter((p) => (routeCollection ? matchesCollectionKey(p, routeCollection) : true)),
    [products, routeGender, routeCollection],
  )
  const searchResults = searchTrimmed ? scopedProducts.filter((p) => matchProduct(p, searchTrimmed)) : []
  const genderAllCatalogPage = isGenderScopedPage && routeCollection === 'all'
  const useWomensAllTypeFilter = genderAllCatalogPage && routeGender === 'womens'
  const categoryFilteredProducts = scopedProducts.filter((p) =>
    (useWomensAllTypeFilter ? productMatchesWomensAllCategory : productMatchesCategory)(p, categoryFilter),
  )
  const mensProducts = categoryFilteredProducts.filter((p) => p.gender === 'mens')
  const womensProducts = categoryFilteredProducts.filter((p) => p.gender === 'womens')
  const showCategoryFilterView =
    !searchTrimmed
    && categoryFilter !== 'all'
    && (!isGenderScopedPage || genderAllCatalogPage)
  const categoryFilterResults = showCategoryFilterView ? categoryFilteredProducts : []

  const typeFilterButtons =
    !isGenderScopedPage || !genderAllCatalogPage
      ? CATEGORY_FILTERS
      : routeGender === 'womens'
        ? WOMENS_ALL_CATEGORY_FILTERS
        : CATEGORY_FILTERS

  const scopedGroups = useMemo(() => groupProductsBySection(categoryFilteredProducts), [categoryFilteredProducts])
  const mensGroups = useMemo(() => groupProductsBySection(mensProducts), [mensProducts])
  const womensGroups = useMemo(() => groupProductsBySection(womensProducts), [womensProducts])
  const searchGroups = useMemo(() => groupProductsBySection(searchResults), [searchResults])
  const filterGroups = useMemo(() => groupProductsBySection(categoryFilterResults), [categoryFilterResults])
  const heroTitle = useMemo(() => {
    if (isGenderScopedPage && routeCollection !== 'all') return getCollectionDisplayName(routeCollection)
    if (routeGender === 'mens') return "Men's Products"
    if (routeGender === 'womens') return "Women's Products"
    return 'All Products'
  }, [isGenderScopedPage, routeCollection, routeGender])
  const heroSubtitle = useMemo(() => {
    if (isGenderScopedPage && routeCollection !== 'all') {
      return `${routeGender === 'mens' ? "Men's" : "Women's"} ${getCollectionDisplayName(routeCollection)} collection.`
    }
    if (routeGender === 'mens') {
      return "Men's products only — browse by collection or search this page."
    }
    if (routeGender === 'womens') {
      return "Women's products only — browse by collection or search this page."
    }
    return "Men's and women's lines, grouped for quick browsing."
  }, [isGenderScopedPage, routeCollection, routeGender])

  const renderSectionGroups = (gender, groups) => (
    <section className="products-category-section products-gender-block" id={gender}>
      <h2 className="products-category-title">{gender === 'mens' ? "Men's" : "Women's"}</h2>
      <p className="products-gender-sub">
        {gender === 'mens' ? "Men's collections" : "Women's collections"} — organized by line.
      </p>
      {groups.map((g) => (
        <div key={g.sectionSlug} id={g.sectionSlug} className="products-store-section">
          <div className="products-store-section-head">
            <SectionTitleBlock items={g.items} sectionTitleShort={g.sectionTitleShort} />
            <div className="products-store-section-meta">
              <span className="products-section-count">{g.items.length} items</span>
            </div>
          </div>
          {renderProductGrid(g.items, findInCart, setSelectedProduct, addToCart, isFavourite, toggleFavourite)}
        </div>
      ))}
    </section>
  )

  return (
    <main className="products-page">
      <section className="products-hero">
        <div className="container">
          <h1>{heroTitle}</h1>
          <p className="products-hero-sub">
            {heroSubtitle}
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
          {isGenderScopedPage && routeCollection !== 'all' ? (
            <CollectionHeroLede routeGender={routeGender} routeCollection={routeCollection} />
          ) : (
            <div className="products-category-filters products-category-filters--boxed">
              {typeFilterButtons.map(({ id, label }) => (
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
          )}
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
                    <SectionTitleBlock items={g.items} sectionTitleShort={g.sectionTitleShort} />
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
              {typeFilterButtons.find((f) => f.id === categoryFilter)?.label} ({categoryFilterResults.length})
            </h2>
            {categoryFilterResults.length > 0 ? (
              filterGroups.map((g) => (
                <div key={g.sectionSlug} className="products-store-section">
                  <div className="products-store-section-head">
                    <SectionTitleBlock items={g.items} sectionTitleShort={g.sectionTitleShort} />
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
      ) : isGenderScopedPage ? (
        <div className="container products-categories">
          <section className="products-category-section products-gender-block">
            <h2 className="products-category-title">{routeGender === 'mens' ? "Men's" : "Women's"} collections</h2>
            <p className="products-gender-sub">
              {routeGender === 'mens' ? "Men's" : "Women's"} catalog only.
            </p>
            {scopedGroups.map((g) => (
              <div key={g.sectionSlug} id={g.sectionSlug} className="products-store-section">
                <div className="products-store-section-head">
                  <SectionTitleBlock items={g.items} sectionTitleShort={g.sectionTitleShort} />
                  <span className="products-section-count">{g.items.length} items</span>
                </div>
                {renderProductGrid(g.items, findInCart, setSelectedProduct, addToCart, isFavourite, toggleFavourite)}
              </div>
            ))}
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
