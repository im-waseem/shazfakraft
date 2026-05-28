'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'

// ─── Data fetchers ────────────────────────────────────────────────────────────
async function getBanners() {
  const sb = createClient()
  const { data } = await sb.from('banners').select('*')
    .eq('is_active', true).eq('display_on_homepage', true)
    .order('position', { ascending: true })
  return data || []
}
async function getFeaturedProducts() {
  const sb = createClient()
  const { data } = await sb.from('products')
    .select('*, categories(name,slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(48)
  return data || []
}
async function getCategories() {
  const sb = createClient()
  const { data } = await sb.from('categories').select('*')
    .eq('is_active', true).order('position', { ascending: true }).limit(10)
  return data || []
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SHOW_SHOP_BY_CATEGORY = false // Set to true to re-enable the Shop by Category section
const CAT_ICONS = ['📖', '🕌', '📿', '🎁', '🏠', '✨', '🌙', '⭐', '🤲', '💎']
const DEFAULT_ANNOUNCEMENTS = [
  'Free shipping on orders over ₹499 ✦ Shop now',
  'Authentic Islamic products, ethically sourced',
  'New arrivals added every week',
  'Trusted by 50+ happy customers across India',
]

// ─── Utility ──────────────────────────────────────────────────────────────────
function discount(price: number, compare: number) {
  return compare > price ? Math.round((1 - price / compare) * 100) : null
}
function rupees(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [user,               setUser]               = useState<any>(null)
  const [banners,            setBanners]            = useState<any[]>([])
  const [allProducts,        setAllProducts]        = useState<any[]>([])
  const [categories,         setCategories]         = useState<any[]>([])
  const [loading,            setLoading]            = useState(true)
  const [searchQuery,        setSearchQuery]        = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange,         setPriceRange]         = useState<[number,number]>([0, 10000])
  const [maxPrice,           setMaxPrice]           = useState(10000)
  const [sortBy,             setSortBy]             = useState('newest')
  const [mobileMenuOpen,     setMobileMenuOpen]     = useState(false)
  const [mobileSidebarOpen,  setMobileSidebarOpen]  = useState(false)
  const [cartCount,          setCartCount]          = useState(0)
  const [wishlist,           setWishlist]           = useState<string[]>([])
  const [currentBanner,      setCurrentBanner]      = useState(0)
  const [addedId,            setAddedId]            = useState<string | null>(null)
  const [visibleCount,       setVisibleCount]       = useState(24)
  const [guestToast,         setGuestToast]         = useState(false)
  const [showWaPopup,        setShowWaPopup]        = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const heroRef   = useRef<HTMLElement>(null)

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const sb = createClient()
      // Auth is optional — we don't block if no user
      const { data: { user } } = await sb.auth.getUser()
      setUser(user)
      const [b, p, c] = await Promise.all([getBanners(), getFeaturedProducts(), getCategories()])
      setBanners(b); setAllProducts(p); setCategories(c)
      if (p.length > 0) {
        const mx = Math.ceil(Math.max(...p.map((x: any) => Number(x.price))))
        setMaxPrice(mx); setPriceRange([0, mx])
      }
      setLoading(false)
    }
    init()
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
      setWishlist(JSON.parse(localStorage.getItem('wishlist') || '[]'))
    } catch {}
  }, [])

  // ── WhatsApp Popup Delay ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('wa-popup-dismissed')
      if (!dismissed) {
        setShowWaPopup(true)
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  // ── Banner auto-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    const texts = banners.length > 0 ? banners : DEFAULT_ANNOUNCEMENTS
    if (texts.length <= 1) return
    const t = setInterval(() => setCurrentBanner(p => (p + 1) % texts.length), 3800)
    return () => clearInterval(t)
  }, [banners.length])

  // ── Filtered products ───────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let r = [...allProducts]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      r = r.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categories?.name?.toLowerCase().includes(q)
      )
    }
    if (selectedCategories.length > 0) r = r.filter(p => selectedCategories.includes(p.category_id))
    r = r.filter(p => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1])
    switch (sortBy) {
      case 'price_asc':  r.sort((a, b) => Number(a.price) - Number(b.price)); break
      case 'price_desc': r.sort((a, b) => Number(b.price) - Number(a.price)); break
      case 'name_asc':   r.sort((a, b) => a.name.localeCompare(b.name));     break
      case 'featured':   r.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break
      default:           r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return r
  }, [allProducts, searchQuery, selectedCategories, priceRange, sortBy])

  const toggleCategory = useCallback((id: string) =>
    setSelectedCategories(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])

  const clearFilters = () => {
    setSearchQuery(''); setSelectedCategories([]); setPriceRange([0, maxPrice]); setSortBy('newest')
  }

  const hasFilters = !!(searchQuery || selectedCategories.length || priceRange[0] > 0 || priceRange[1] < maxPrice || sortBy !== 'newest')

  const toggleWishlist = (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id]
    setWishlist(next)
    try { localStorage.setItem('wishlist', JSON.stringify(next)) } catch {}
  }

  // ── GUEST-FRIENDLY Add to Cart — no login required ──────────────────────────
  const addToCart = (product: any) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const idx  = cart.findIndex((i: any) => i.productId === product.id)
      if (idx >= 0) {
        cart[idx].quantity += 1
      } else {
        cart.push({
          id:         Date.now().toString(),
          cartKey:    product.id,
          productId:  product.id,
          name:       product.name,
          price:      Number(product.price),
          quantity:   1,
          image:      product.main_image_url || product.image_url || '',
          sku:        product.sku || '',
          // size/color will be selected on product detail page
        })
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0))
    } catch {}
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1600)
    // Show guest nudge once if not logged in
    if (!user) {
      setGuestToast(true)
      setTimeout(() => setGuestToast(false), 3500)
    }
  }

  const announcementTexts = banners.length > 0
    ? banners.map((b: any) => b.title)
    : DEFAULT_ANNOUNCEMENTS

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 20px', border: '3px solid #e8d5b0', borderTop: '3px solid #c8860a', borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", color: '#c8860a', fontSize: 18, letterSpacing: '.15em' }}>Shazfa kraft</p>
        <p style={{ color: '#c9b49a', fontSize: 12, marginTop: 4 }}>Loading your store…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    // ↓ KEY FIX: display:flex + flex-direction:column ensures footer is always
    //   flush to the bottom and the page stretches full width
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      background: '#fffbf5',
      fontFamily: "'Nunito', sans-serif",
      color: '#1c1410',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Nunito:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --cream:#fffbf5; --warm:#fdf3e3; --warm2:#fef8ee;
          --gold:#c8860a;  --gold-l:#e09a12; --gold-pale:#fef3d8; --gold-xpale:#fffbf0;
          --sage:#6b7c5c;  --brick:#c04e2a;
          --text:#1c1410;  --t2:#5a4a3a; --t3:#9a8a7a; --t4:#c9b9a8;
          --border:#ecdcc8; --border2:#dccaaa;
          --r:14px; --rsm:8px; --rxl:20px;
          --shadow:0 4px 24px rgba(28,20,16,.07);
          --shadow-md:0 8px 32px rgba(28,20,16,.10);
          --shadow-lg:0 16px 48px rgba(28,20,16,.13);
        }

        /* ── ANNOUNCEMENT ── */
        .ann-bar{background:linear-gradient(90deg,#5c3209,#c8860a,#5c3209);padding:10px 16px;text-align:center;position:relative;overflow:hidden;width:100%}
        .ann-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:shimmer 3s ease-in-out infinite;background-size:200% 100%}
        @keyframes shimmer{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}
        .ann-text{color:#fff;font-size:12px;font-weight:700;letter-spacing:.07em;position:relative;animation:fadeUp .4s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .ann-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.4);cursor:pointer;transition:all .25s;flex-shrink:0}
        .ann-dot.on{background:#fff;width:14px;border-radius:3px}

        /* ── NAVBAR ── */
        .navbar{background:#fff;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:40;box-shadow:0 2px 16px rgba(200,134,10,.05);width:100%}
        .nav-inner{max-width:1340px;margin:0 auto;padding:0 20px;display:flex;align-items:center;height:62px;gap:16px}
        .logo-mark{font-family:"Cormorant Garamond",serif;font-size:26px;font-weight:700;color:var(--gold);letter-spacing:-.01em;line-height:1;text-decoration:none}
        .logo-sub{font-size:8px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--t3);display:block;margin-top:-1px}
        .nav-link{color:var(--t2);font-size:13px;font-weight:700;text-decoration:none;padding:5px 0;border-bottom:2px solid transparent;transition:all .18s;letter-spacing:.02em;white-space:nowrap}
        .nav-link:hover{color:var(--gold);border-bottom-color:var(--gold)}
        .nav-icon-btn{position:relative;color:var(--t2);display:flex;padding:8px;border-radius:10px;text-decoration:none;transition:background .15s}
        .nav-icon-btn:hover{background:var(--warm)}
        .nav-badge{position:absolute;top:5px;right:5px;width:14px;height:14px;border-radius:50%;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;color:#fff;border:2px solid #fff}
        .burger{background:none;border:none;cursor:pointer;padding:6px;color:var(--text);border-radius:8px;display:none}
        @media(max-width:768px){.burger{display:flex}.nav-desktop{display:none!important}}

        /* ── MOBILE MENU ── */
        .mob-menu{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column}
        .mob-menu-overlay{position:absolute;inset:0;background:rgba(28,20,16,.5);backdrop-filter:blur(4px)}
        .mob-menu-panel{position:relative;z-index:1;background:#fff;width:280px;height:100%;padding:24px;display:flex;flex-direction:column;gap:6px;animation:slideRight .25s cubic-bezier(.4,0,.2,1)}
        @keyframes slideRight{from{transform:translateX(-100%)}to{transform:none}}
        .mob-nav-link{display:block;padding:12px 14px;border-radius:10px;color:var(--text);font-weight:600;font-size:15px;text-decoration:none;transition:background .15s}
        .mob-nav-link:hover{background:var(--warm);color:var(--gold)}

        /* ── GUEST TOAST ── */
        .guest-toast{
          position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
          background:#1c1410;color:#fff;
          padding:11px 20px;border-radius:50px;
          font-size:13px;font-weight:600;
          box-shadow:0 8px 32px rgba(0,0,0,.25);
          z-index:200;white-space:nowrap;
          display:flex;align-items:center;gap:10px;
          animation:toastIn .3s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .guest-toast a{color:var(--gold);font-weight:800;text-decoration:none}
        .guest-toast a:hover{text-decoration:underline}

        /* ── HERO ── */
        .hero{background:linear-gradient(160deg,#1c1410 0%,#3d2112 55%,#6b3c12 100%);padding:clamp(52px,8vw,100px) 20px clamp(80px,12vw,140px);text-align:center;position:relative;overflow:hidden;width:100%}
        .hero-orb{position:absolute;border-radius:50%;pointer-events:none}
        .hero-eyebrow{font-family:"Cormorant Garamond",serif;font-size:clamp(12px,2vw,14px);color:#d4a843;letter-spacing:.28em;text-transform:uppercase;font-style:italic;margin-bottom:14px}
        .hero-h1{font-family:"Cormorant Garamond",serif;font-size:clamp(2.4rem,6vw,4.8rem);font-weight:700;color:#fff;line-height:1.08;margin-bottom:16px}
        .hero-sub{color:rgba(255,255,255,.6);font-size:clamp(14px,2vw,17px);max-width:460px;margin:0 auto 40px;line-height:1.7}
        .search-wrap{position:relative;max-width:600px;margin:0 auto}
        .search-input{width:100%;padding:17px 24px 17px 56px;font-size:15px;font-family:inherit;background:rgba(255,255,255,.97);border:2px solid transparent;border-radius:60px;outline:none;color:var(--text);transition:all .25s;box-shadow:0 8px 32px rgba(0,0,0,.25)}
        .search-input:focus{border-color:var(--gold);box-shadow:0 8px 40px rgba(200,134,10,.3)}
        .search-icon{position:absolute;left:20px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}
        .search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--t3);color:#fff;border:none;border-radius:50px;padding:9px 20px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
        .search-clear:hover{background:var(--t2)}
        .cat-pills{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:22px}
        .cat-pill{background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.2);border-radius:50px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;color:rgba(255,255,255,.8);transition:all .2s;font-family:inherit}
        .cat-pill:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4);color:#fff}
        .cat-pill.on{background:var(--gold);border-color:var(--gold);color:#fff}

        /* ── CATEGORY GRID ── */
        .section{max-width:1340px;margin:0 auto;padding:0 20px;width:100%}
        .section-title{font-family:"Cormorant Garamond",serif;font-size:clamp(1.5rem,3vw,2.2rem);font-weight:700;color:var(--text)}
        .cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;margin-top:20px}
        .cat-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:18px 12px;text-align:center;cursor:pointer;transition:all .25s;font-family:inherit;color:var(--text);width:100%}
        .cat-card:hover{border-color:var(--gold-l);box-shadow:var(--shadow-md);transform:translateY(-4px)}
        .cat-card-icon{width:48px;height:48px;border-radius:50%;background:var(--gold-pale);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:20px}
        .cat-card-name{font-size:12px;font-weight:700;line-height:1.3}

        /* ── MAIN LAYOUT ── */
        /* flex:1 on main-wrap makes it grow to fill space, pushing footer down */
        .page-body{flex:1;width:100%}
        .main-wrap{max-width:1340px;margin:0 auto;padding:32px 20px 72px;display:grid;grid-template-columns:220px 1fr;gap:28px;align-items:start}
        @media(max-width:900px){.main-wrap{grid-template-columns:1fr}.sidebar-desktop{display:none!important}}

        /* ── SIDEBAR ── */
        .sidebar{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:22px;position:sticky;top:80px}
        .sidebar-title{font-size:14px;font-weight:800;color:var(--text);letter-spacing:.01em}
        .sidebar-label{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--t3);margin-bottom:12px}
        .sidebar-section{padding-bottom:22px;margin-bottom:22px;border-bottom:1px solid var(--border)}
        .check-row{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;cursor:pointer;transition:background .12s;user-select:none}
        .check-row:hover{background:var(--warm)}
        .check-box{width:17px;height:17px;border-radius:5px;border:2px solid var(--border2);background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .check-box.on{background:var(--gold);border-color:var(--gold)}
        .range-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:var(--border2);outline:none}
        .range-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--gold);cursor:pointer;border:3px solid #fff;box-shadow:0 2px 8px rgba(200,134,10,.35)}
        .clear-btn{background:none;border:none;color:var(--gold);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;padding:0}
        .clear-btn:hover{text-decoration:underline}
        .sort-sel{background:var(--warm);border:1.5px solid var(--border2);border-radius:var(--rsm);padding:9px 32px 9px 12px;font-size:13px;font-family:inherit;color:var(--text);outline:none;cursor:pointer;appearance:none;width:100%}
        .sort-sel:focus{border-color:var(--gold)}

        /* ── PRODUCT GRID ── */
        .prod-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        .prod-count{color:var(--t3);font-size:12px;margin-top:2px}
        .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
        @media(max-width:480px){.prod-grid{grid-template-columns:repeat(2,1fr);gap:12px}}

        /* ── PRODUCT CARD ── */
        .p-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;cursor:pointer}
        .p-card:hover{border-color:#dab96a;transform:translateY(-5px);box-shadow:var(--shadow-lg)}
        .p-img-wrap{aspect-ratio:1;overflow:hidden;background:var(--warm);position:relative}
        .p-img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.4,0,.2,1)}
        .p-card:hover .p-img{transform:scale(1.08)}
        .p-actions{position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(0deg,rgba(255,251,245,.99) 55%,transparent);transform:translateY(101%);transition:transform .24s cubic-bezier(.4,0,.2,1)}
        .p-card:hover .p-actions{transform:none}
        .add-btn{background:var(--gold);color:#fff;border:none;border-radius:50px;padding:10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;width:100%;letter-spacing:.04em;transition:all .2s}
        .add-btn:hover{background:var(--gold-l)}
        .add-btn.added{background:#22c55e}
        .add-btn:disabled{background:var(--t4);cursor:not-allowed}
        .wl-btn{position:absolute;top:9px;right:9px;width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:14px;z-index:2}
        .wl-btn:hover{border-color:var(--brick)}
        .wl-btn.on{background:#fff0ed;border-color:var(--brick)}
        .badge-featured{position:absolute;top:9px;left:9px;background:var(--gold-pale);color:var(--gold);font-size:9px;font-weight:800;padding:3px 8px;border-radius:6px;border:1px solid #e8d089;letter-spacing:.06em}
        .badge-disc{position:absolute;top:9px;left:9px;background:var(--brick);color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:6px;letter-spacing:.04em}
        .badge-oos{position:absolute;inset:0;background:rgba(255,251,245,.8);display:flex;align-items:center;justify-content:center}
        .p-body{padding:11px 13px 10px}
        .p-cat{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--sage)}
        .p-name{font-size:13px;font-weight:700;margin-top:3px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--text)}
        .p-price{font-size:16px;font-weight:700;color:var(--gold);font-family:"Cormorant Garamond",serif;margin-top:7px}
        .p-compare{font-size:12px;color:var(--t3);text-decoration:line-through;margin-left:7px}
        .p-low-stock{font-size:10px;font-weight:700;color:#e07a40;margin-top:3px}

        /* ── MOBILE FILTER BTN ── */
        .mob-filter-btn{display:none;align-items:center;gap:8px;background:#fff;border:1.5px solid var(--border2);border-radius:50px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;color:var(--t2)}
        @media(max-width:900px){.mob-filter-btn{display:flex}}

        /* ── MOBILE SIDEBAR ── */
        .mob-sidebar-overlay{position:fixed;inset:0;background:rgba(28,20,16,.5);z-index:50;backdrop-filter:blur(3px)}
        .mob-sidebar{position:fixed;left:0;top:0;bottom:0;width:288px;background:#fff;z-index:51;overflow-y:auto;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);padding:24px}
        .mob-sidebar.open{transform:none}

        /* ── ACTIVE FILTER CHIPS ── */
        .filter-chip{background:var(--gold-pale);border:1px solid #e8d089;color:var(--gold);font-size:11px;font-weight:700;padding:4px 10px;border-radius:50px;cursor:pointer;transition:all .15s}
        .filter-chip:hover{background:var(--gold);color:#fff}

        /* ── EMPTY STATE ── */
        .empty-state{background:#fff;border:1px solid var(--border);border-radius:var(--rxl);padding:64px 32px;text-align:center}
        .empty-icon{font-size:56px;margin-bottom:18px}
        .empty-title{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:700;margin-bottom:8px}

        /* ── LOAD MORE ── */
        .load-more-btn{background:#fff;border:2px solid var(--border2);border-radius:50px;padding:13px 36px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;color:var(--t2);transition:all .2s;display:block;margin:32px auto 0}
        .load-more-btn:hover{border-color:var(--gold);color:var(--gold)}

        /* ══════════════════════════════════════
           FOOTER FIX — full width, no centering
        ══════════════════════════════════════ */
        .footer{
          background:#1c1410;
          color:#e8d5b0;
          padding:56px 20px 28px;
          /* removed margin-top:16px — use page-body flex:1 instead */
          width:100%;          /* span full viewport width */
          flex-shrink:0;       /* never shrink inside flex column */
        }
        .footer-inner{max-width:1340px;margin:0 auto;width:100%}
        .footer-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
          gap:36px;
          margin-bottom:44px;
          width:100%;
        }
        .footer-logo{font-family:"Cormorant Garamond",serif;font-size:28px;font-weight:700;color:#d4a843;margin-bottom:10px}
        .footer-desc{color:#8a6a4a;font-size:13px;line-height:1.75}
        .footer-head{font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#d4a843;margin-bottom:14px}
        .footer-link{color:#7a6050;font-size:13px;text-decoration:none;display:block;margin-bottom:8px;transition:color .18s}
        .footer-link:hover{color:var(--gold)}
        .footer-bottom{
          border-top:1px solid rgba(255,255,255,.07);
          padding-top:22px;
          display:flex;
          justify-content:space-between;
          flex-wrap:wrap;
          gap:10px;
          width:100%;
        }
        .footer-copy{color:#4a3a2a;font-size:12px}

        /* ── GUEST BANNER (below navbar) ── */
        .guest-banner{
          background:linear-gradient(90deg,#fef3d8,#fffbf0);
          border-bottom:1px solid #e8d898;
          padding:9px 20px;
          display:flex;align-items:center;justify-content:center;
          gap:12px;flex-wrap:wrap;
          font-size:12.5px;color:var(--t2);font-weight:600;
          width:100%;
        }
        .guest-banner a{color:var(--gold);font-weight:800;text-decoration:none;border-bottom:1px solid var(--gold)}
        .guest-banner a:hover{opacity:.8}
        .guest-banner-dismiss{background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px;padding:0;line-height:1;margin-left:4px}

        /* ── WA BUBBLE ── */
        .wa-container {
          position: fixed;
          bottom: 22px;
          right: 18px;
          z-index: 60;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .wa-bubble {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #25d366;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(37,211,102,.35);
          transition: all .3s cubic-bezier(.175, .885, .32, 1.275);
          position: relative;
          cursor: pointer;
          animation: wa-bounce-wiggle 6s ease-in-out infinite;
        }
        .wa-bubble:hover {
          animation: none;
          transform: scale(1.1) translateY(-2px);
          background: #20ba5a;
          box-shadow: 0 10px 28px rgba(37,211,102,.5);
        }
        .wa-bubble::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #25d366;
          opacity: 0;
          animation: wa-pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        @keyframes wa-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes wa-bounce-wiggle {
          0%, 100% { transform: scale(1) translateY(0); }
          10% { transform: scale(1.1) translateY(-6px) rotate(-5deg); }
          20% { transform: scale(1.1) translateY(-6px) rotate(5deg); }
          30% { transform: scale(1) translateY(0) rotate(0); }
        }
        .wa-popup {
          position: absolute;
          bottom: 72px;
          right: 0;
          width: 250px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(236, 220, 200, 0.6);
          padding: 14px 16px;
          z-index: 70;
          animation: wa-popup-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .wa-popup:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.16), 0 3px 12px rgba(0, 0, 0, 0.08);
        }
        @keyframes wa-popup-in {
          from { opacity: 0; transform: translateY(15px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .wa-popup-arrow {
          position: absolute;
          bottom: -6px;
          right: 22px;
          width: 12px;
          height: 12px;
          background: #ffffff;
          transform: rotate(45deg);
          border-right: 1px solid rgba(236, 220, 200, 0.6);
          border-bottom: 1px solid rgba(236, 220, 200, 0.6);
        }
        .wa-popup-close {
          position: absolute;
          top: 8px;
          right: 10px;
          background: none;
          border: none;
          color: #9a8a7a;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }
        .wa-popup-close:hover {
          background: #fdf3e3;
          color: #1c1410;
        }
        .wa-popup-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .wa-dot {
          width: 7px;
          height: 7px;
          background-color: #25d366;
          border-radius: 50%;
          display: inline-block;
          animation: wa-dot-pulse 1.5s infinite;
        }
        @keyframes wa-dot-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .wa-status {
          font-size: 11px;
          color: #6b7c5c;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .wa-popup-text {
          font-size: 14px;
          color: #1c1410;
          font-weight: 600;
          line-height: 1.4;
          margin: 0;
        }

        /* ── SCROLL TO TOP ── */
        .scroll-top{position:fixed;bottom:22px;left:18px;width:38px;height:38px;border-radius:50%;background:#fff;border:1.5px solid var(--border2);color:var(--t2);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:var(--shadow);z-index:60;font-size:16px;transition:all .2s}
        .scroll-top:hover{border-color:var(--gold);color:var(--gold)}

        /* ── UTILITY ── */
        .divider{height:1px;background:var(--border);margin:0}
        @keyframes popIn{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}

        /* ══════════════════════════════════════════════
           MOBILE RESPONSIVENESS — all breakpoints
        ══════════════════════════════════════════════ */

        /* Touch devices: always show Add-to-Cart, remove hover-only effects */
        @media(hover:none){
          .p-actions{transform:none!important;position:relative;background:linear-gradient(0deg,rgba(255,251,245,.98) 60%,transparent)}
          .p-card:hover{transform:none!important;box-shadow:none!important}
          .p-card:hover .p-img{transform:none!important}
          .add-btn{padding:11px;font-size:12px;border-radius:50px}
        }

        /* Safe-area insets for fixed floating buttons */
        @supports(padding:env(safe-area-inset-bottom)){
          .wa-container{bottom:calc(22px + env(safe-area-inset-bottom))}
          .scroll-top{bottom:calc(22px + env(safe-area-inset-bottom))}
        }

        /* ── 480px and below ── */
        @media(max-width:480px){
          /* Announcement bar */
          .ann-bar{padding:8px 12px}
          .ann-text{font-size:11px;letter-spacing:.04em}

          /* Hero */
          .hero{padding:clamp(36px,8vw,52px) 16px clamp(52px,10vw,72px);overflow:hidden}
          .hero-eyebrow{font-size:11px;letter-spacing:.16em;margin-bottom:10px}
          .hero-sub{font-size:13px;margin-bottom:28px;padding:0 4px}

          /* Hide large decorative SVG on mobile */
          .hero > svg{display:none}

          /* Search bar */
          .search-input{padding:13px 48px 13px 46px;font-size:14px;border-radius:50px}
          .search-icon{left:15px}
          .search-clear{right:6px;padding:7px 14px;font-size:12px}

          /* Category pills */
          .cat-pills{gap:6px;margin-top:14px}
          .cat-pill{padding:9px 14px;font-size:11px;min-height:40px;border-radius:50px}

          /* Main layout */
          .main-wrap{padding:18px 12px 48px;gap:16px}

          /* Product toolbar */
          .prod-toolbar{gap:8px}
          .prod-toolbar > div:first-child p:first-child{font-size:17px}

          /* Product grid */
          .prod-grid{gap:10px}
          .p-body{padding:8px 10px}
          .p-cat{font-size:8.5px}
          .p-name{font-size:12px}
          .p-price{font-size:14px}
          .p-compare{font-size:10.5px;margin-left:5px}
          .p-low-stock{font-size:9.5px}

          /* Wishlist button */
          .wl-btn{width:28px;height:28px;font-size:12px;top:7px;right:7px}

          /* Badges */
          .badge-disc,.badge-featured{font-size:8.5px;padding:2px 6px}

          /* Category grid */
          .cat-grid{grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}
          .cat-card{padding:14px 8px}
          .cat-card-icon{width:42px;height:42px;font-size:18px}
          .cat-card-name{font-size:11px}

          /* Guest banner */
          .guest-banner{padding:8px 14px;font-size:11.5px;gap:8px}

          /* Empty state */
          .empty-state{padding:40px 18px}
          .empty-icon{font-size:44px}
          .empty-title{font-size:19px}

          /* Load more */
          .load-more-btn{padding:11px 24px;font-size:13px}

          /* Footer */
          .footer{padding:36px 16px 24px}
          .footer-grid{gap:28px;margin-bottom:32px}
          .footer-logo{font-size:24px}
          .footer-bottom{flex-direction:column;align-items:center;text-align:center;gap:6px}
          .footer-copy{font-size:11px}

          /* Section title */
          .section-title{font-size:clamp(1.3rem,5vw,1.8rem)}

          /* WA popup width constraint */
          .wa-popup{width:min(240px,calc(100vw - 80px));right:-4px}

          /* Guest toast - allow wrapping */
          .guest-toast{
            white-space:normal;
            max-width:calc(100vw - 40px);
            flex-wrap:wrap;
            justify-content:center;
            text-align:center;
            padding:10px 16px;
            gap:7px;
            bottom:76px
          }
        }

        /* ── 375px and below ── */
        @media(max-width:375px){
          .hero-h1{font-size:clamp(1.9rem,9vw,2.5rem)}
          .search-input{font-size:13px;padding:12px 44px 12px 44px}
          .prod-grid{gap:8px}
          .p-body{padding:7px 9px}
          .p-name{font-size:11.5px}
          .p-price{font-size:13px}
          .main-wrap{padding:16px 10px 44px}
          .cat-grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:7px}
          .cat-card-icon{width:38px;height:38px;font-size:16px}
          .cat-card-name{font-size:10.5px}
        }

        /* ── 320px ── */
        @media(max-width:320px){
          .hero-h1{font-size:clamp(1.7rem,9vw,2.2rem);margin-bottom:12px}
          .hero-eyebrow{font-size:10px;letter-spacing:.12em}
          .hero-sub{font-size:12px;margin-bottom:22px}
          .search-input{padding:11px 40px;font-size:13px}
          .main-wrap{padding:14px 8px 40px}
          .prod-grid{gap:7px}
          .p-body{padding:6px 8px}
          .p-name{font-size:11px}
          .footer{padding:28px 12px 20px}
          .footer-grid{gap:22px}
        }

        /* ── Tablets (481px–768px) ── */
        @media(min-width:481px) and (max-width:768px){
          .prod-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
          .main-wrap{padding:24px 16px 60px}
          .hero{padding:clamp(52px,8vw,80px) 20px clamp(72px,10vw,100px)}
        }

        /* ── Mobile sidebar width safety ── */
        @media(max-width:360px){
          .mob-sidebar{width:min(272px,calc(100vw - 32px))}
        }
      `}</style>

      {/* ══ ANNOUNCEMENT BAR ══════════════════════════════════════════════════ */}
      <div className="ann-bar">
        <div className="ann-shimmer" />
        <p key={currentBanner} className="ann-text">
          ✦ &nbsp;{announcementTexts[currentBanner % announcementTexts.length]}&nbsp; ✦
        </p>
        {announcementTexts.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 6 }}>
            {announcementTexts.map((_, i) => (
              <div key={i} className={`ann-dot ${i === currentBanner ? 'on' : ''}`}
                onClick={() => setCurrentBanner(i)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Guest nudge banner (only for non-logged-in, dismissible) ─────── */}
      {!user && (
        <GuestBanner />
      )}

      {/* ══ PAGE BODY (flex:1) ════════════════════════════════════════════════ */}
      <div className="page-body">

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section className="hero" ref={heroRef}>
          <div className="hero-orb" style={{ top: -100, right: -100, width: 320, height: 320, background: 'rgba(200,134,10,.12)', filter: 'blur(60px)' }} />
          <div className="hero-orb" style={{ bottom: -80, left: -80, width: 240, height: 240, background: 'rgba(192,78,42,.1)', filter: 'blur(50px)' }} />
          <svg style={{ position: 'absolute', right: '5%', top: '10%', opacity: .08 }} width="200" height="200" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#d4a843" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" stroke="#d4a843" strokeWidth="1" />
            <circle cx="100" cy="100" r="30" stroke="#d4a843" strokeWidth="1" />
          </svg>

          <p className="hero-eyebrow">Your Islamic Lifestyle Store · Bangalore &amp; All India</p>
          <h1 className="hero-h1">
            Discover Authentic<br />
            <span style={{ color: '#d4a843', fontStyle: 'italic' }}>Islamic Products</span>
          </h1>
          <p className="hero-sub">Curated with care — books, prayer items, home décor &amp; more, delivered across India.</p>

          {/* Search */}
          <div className="search-wrap">
            <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={searchRef} type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search books, prayer mats, tasbih, itar…"
              className="search-input"
              onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear">Clear</button>
            )}
          </div>

          {/* Quick category pills */}
          {categories.length > 0 && (
            <div className="cat-pills">
              {categories.slice(0, 7).map(c => (
                <button key={c.id} onClick={() => toggleCategory(c.id)} className={`cat-pill ${selectedCategories.includes(c.id) ? 'on' : ''}`}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ══ CATEGORY SHOWCASE ════════════════════════════════════════════════ */}
        {SHOW_SHOP_BY_CATEGORY && categories.length > 0 && !searchQuery && selectedCategories.length === 0 && (
          <div style={{ padding: '44px 20px 0', width: '100%' }}>
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
                <h2 className="section-title">Shop by Category</h2>
                <Link href="/products" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
              </div>
              <div className="cat-grid">
                {categories.map((c, i) => (
                  <button key={c.id} onClick={() => { toggleCategory(c.id); heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }}
                    className="cat-card">
                    <div className="cat-card-icon">{CAT_ICONS[i % CAT_ICONS.length]}</div>
                    <p className="cat-card-name">{c.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ MAIN: SIDEBAR + PRODUCTS ══════════════════════════════════════════ */}
        <div className="main-wrap">

          {/* Desktop Sidebar */}
          <aside className="sidebar sidebar-desktop">
            <SidebarContent {...{ categories, selectedCategories, toggleCategory, priceRange, setPriceRange, maxPrice, hasFilters, clearFilters }} />
          </aside>

          {/* Mobile Sidebar */}
          {mobileSidebarOpen && (
            <>
              <div className="mob-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
              <div className="mob-sidebar open">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Filters</span>
                  <button onClick={() => setMobileSidebarOpen(false)} style={{ background: '#f5f5f5', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
                <SidebarContent {...{ categories, selectedCategories, toggleCategory, priceRange, setPriceRange, maxPrice, hasFilters, clearFilters: () => { clearFilters(); setMobileSidebarOpen(false) } }} />
              </div>
            </>
          )}

          {/* Products */}
          <main>
            {/* Toolbar */}
            <div className="prod-toolbar">
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>
                  {searchQuery
                    ? <>Results for <span style={{ color: 'var(--gold)' }}>"{searchQuery}"</span></>
                    : selectedCategories.length > 0
                      ? categories.find(c => selectedCategories.includes(c.id))?.name || 'Filtered'
                      : 'All Products'}
                </p>
                <p className="prod-count">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className="mob-filter-btn" onClick={() => setMobileSidebarOpen(true)}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M10 20h4" /></svg>
                  Filters {hasFilters && <span style={{ background: 'var(--gold)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
                </button>
                {selectedCategories.map(id => {
                  const cat = categories.find(c => c.id === id)
                  return cat ? <button key={id} onClick={() => toggleCategory(id)} className="filter-chip">{cat.name} ×</button> : null
                })}
                <div style={{ position: 'relative' }}>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-sel">
                    <option value="newest">Newest</option>
                    <option value="featured">Featured</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                    <option value="name_asc">A–Z</option>
                  </select>
                  <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t3)' }} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="prod-grid">
                  {filteredProducts.slice(0, visibleCount).map(product => {
                    const disc      = product.compare_price ? discount(Number(product.price), Number(product.compare_price)) : null
                    const inWL      = wishlist.includes(product.id)
                    const outOfStock = product.inventory_quantity === 0 ? 'Out of stock' : false
                    const lowStock   = product.inventory_quantity > 0 && product.inventory_quantity <= 10
                    const justAdded  = addedId === product.id

                    return (
                      <div key={product.id} className="p-card">
                        <div className="p-img-wrap">
                          <Link href={`/products/${product.slug}`} style={{ display: 'block', height: '100%' }}>
                            {product.main_image_url || product.image_url
                              ? <img src={product.main_image_url || product.image_url} alt={product.name} className="p-img" loading="lazy" />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>🎁</div>
                            }
                          </Link>
                          {disc && !product.is_featured && <span className="badge-disc">-{disc}%</span>}
                          {product.is_featured && !disc && <span className="badge-featured">FEATURED</span>}
                          {outOfStock && (
                            <div className="badge-oos">
                              <span style={{ color: 'var(--t3)', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Out of Stock</span>
                            </div>
                          )}
                          {/* Add to Cart — works for GUESTS too */}
                          {!outOfStock && (
                            <div className="p-actions">
                              <button className={`add-btn ${justAdded ? 'added' : ''}`} onClick={() => addToCart(product)}>
                                {justAdded ? '✓ Added!' : '+ Add to Cart'}
                              </button>
                            </div>
                          )}
                        </div>

                        <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                          <div className="p-body">
                            {product.categories && <p className="p-cat">{product.categories.name}</p>}
                            <p className="p-name">{product.name}</p>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                              <span className="p-price">{rupees(Number(product.price))}</span>
                              {disc && <span className="p-compare">{rupees(Number(product.compare_price))}</span>}
                            </div>
                            {lowStock && (
                              <p className="p-low-stock">Only {product.inventory_quantity} left!</p>
                            )}
                          </div>
                        </Link>

                        <button className={`wl-btn ${inWL ? 'on' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Wishlist">
                          {inWL ? '❤️' : '🤍'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {visibleCount < filteredProducts.length && (
                  <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 24)}>
                    Load more · {filteredProducts.length - visibleCount} remaining
                  </button>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">{searchQuery ? '🔍' : '📦'}</div>
                <p className="empty-title">{searchQuery ? 'No results found' : 'No products found'}</p>
                <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 24 }}>
                  {searchQuery ? `Nothing matched "${searchQuery}". Try another term.` : 'Try clearing your filters.'}
                </p>
                <button onClick={clearFilters} style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 50, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>

      </div>{/* end page-body */}

      {/* ══ FOOTER — full width, always at bottom ════════════════════════════ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <p className="footer-logo">Shazfa kraft</p>
              <p className="footer-desc">Your trusted Islamic lifestyle store. Authentic products, ethically sourced and delivered across India.</p>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(200,134,10,.1)', borderRadius: 10, border: '1px solid rgba(200,134,10,.2)' }}>
                <p style={{ fontSize: 11, color: '#d4a843', fontWeight: 700, marginBottom: 4 }}>🛒 No Account Needed</p>
                <p style={{ fontSize: 11, color: '#7a6050' }}>You can browse, add to cart and place orders as a guest. Sign in to track orders.</p>
              </div>
            </div>
            <div>
              <p className="footer-head">Shop</p>
              {categories.slice(0, 5).map(c => (
                <a key={c.id} href={`/products?category=${c.slug}`} className="footer-link">{c.name}</a>
              ))}
            </div>
            <div>
              <p className="footer-head">Account</p>
              {[['/profile', 'My Profile'], ['/orders', 'My Orders'], ['/wishlist', 'Wishlist'], ['/contact', 'Contact Us']].map(([href, label]) => (
                <Link key={href} href={href} className="footer-link">{label}</Link>
              ))}
              {!user && (
                <>
                  <Link href="/checkout" className="footer-link" style={{ color: 'var(--gold)', fontWeight: 700 }}>Guest Checkout →</Link>
                  <Link href="/login" className="footer-link">Sign In / Register</Link>
                </>
              )}
            </div>
            <div>
              <p className="footer-head">Contact</p>
              <p style={{ color: '#8a6a4a', fontSize: 13, marginBottom: 6 }}>support@shazfakraft.in</p>
              <a href="https://wa.me/917022831935" target="_blank" rel="noopener noreferrer"
                style={{ color: '#25D366', fontSize: 13, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                ☎ WhatsApp Us
              </a>
              <p style={{ color: '#6a5040', fontSize: 12, marginTop: 16 }}>Mon–Sat · 9am–7pm IST</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© {new Date().getFullYear()} Shazfa kraft. All rights reserved.</p>
            <p className="footer-copy">Made with ✦ in Bangalore</p>
          </div>
        </div>
      </footer>

      {/* ══ FLOATING BUTTONS ══════════════════════════════════════════════════ */}
      <button className="scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">↑</button>
      
      <div className="wa-container">
        {showWaPopup && (
          <div className="wa-popup">
            <button className="wa-popup-close" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowWaPopup(false);
              sessionStorage.setItem('wa-popup-dismissed', 'true');
            }} aria-label="Close popup">×</button>
            <div className="wa-popup-content" onClick={() => window.open("https://wa.me/917022831935", "_blank")}>
              <div className="wa-popup-header">
                <span className="wa-dot"></span>
                <span className="wa-status">Online</span>
              </div>
              <p className="wa-popup-text">Hi! How can I help you?</p>
            </div>
            <div className="wa-popup-arrow"></div>
          </div>
        )}
        <a href="https://wa.me/917022831935" target="_blank" rel="noopener noreferrer" className="wa-bubble" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.765.46 3.42 1.258 4.887L2 22l5.247-1.378a9.957 9.957 0 0 0 4.765 1.22c5.532 0 10.012-4.48 10.012-10.012S17.544 2 12.012 2zm6.757 14.288c-.282.788-1.42 1.442-1.956 1.503-.497.056-.99.27-3.178-.582-2.793-1.09-4.577-3.92-4.717-4.108-.138-.187-1.127-1.493-1.127-2.846 0-1.353.708-2.015.96-2.28.25-.264.55-.33.73-.33.18 0 .36 0 .52.008.173.007.404-.067.63.475.228.548.78 1.902.847 2.038.067.135.111.293.02.476-.09.18-.135.293-.27.45-.135.158-.283.353-.404.474-.136.136-.28.283-.12.557.16.273.712 1.17 1.528 1.89.1.088.196.175.29.256.713.626 1.238.835 1.488.986.25.152.395.127.542-.045.148-.172.63-.736.797-.986.167-.25.334-.21.56-.127.228.083 1.448.68 1.697.804.248.125.413.187.473.29.06.103.06.59-.22.378z" />
          </svg>
        </a>
      </div>

      {/* Guest cart toast */}
      {guestToast && (
        <div className="guest-toast">
          <span>🛒 Added!</span>
          <span style={{ opacity: .7 }}>|</span>
          <Link href="/cart">View Cart</Link>
          <span style={{ opacity: .5 }}>·</span>
          <Link href="/checkout">Checkout →</Link>
        </div>
      )}
    </div>
  )
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────
function GuestBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="guest-banner">
      <span>🛒 Shop without an account — <strong>no sign-up required</strong> to place orders.</span>
      <Link href="/checkout">Start shopping →</Link>
      <button className="guest-banner-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">×</button>
    </div>
  )
}

// ─── Sidebar Component ────────────────────────────────────────────────────────
function SidebarContent({ categories, selectedCategories, toggleCategory, priceRange, setPriceRange, maxPrice, hasFilters, clearFilters }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <span className="sidebar-title">Filters</span>
        {hasFilters && <button onClick={clearFilters} className="clear-btn">Clear all</button>}
      </div>

      {/* Categories */}
      <div className="sidebar-section">
        <p className="sidebar-label">Categories</p>
        {categories.map((cat: any) => (
          <div key={cat.id} className="check-row" onClick={() => toggleCategory(cat.id)}>
            <div className={`check-box ${selectedCategories.includes(cat.id) ? 'on' : ''}`}>
              {selectedCategories.includes(cat.id) && (
                <svg width="9" height="9" fill="none" stroke="#fff" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: selectedCategories.includes(cat.id) ? 'var(--gold)' : 'var(--text)', fontWeight: selectedCategories.includes(cat.id) ? 700 : 500 }}>
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      {/* Price */}
      <div className="sidebar-section">
        <p className="sidebar-label">Price Range</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>₹{priceRange[0].toLocaleString('en-IN')}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>₹{priceRange[1].toLocaleString('en-IN')}</span>
        </div>
        {(['Min', 'Max'] as const).map((label, i) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 6, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
            <input type="range" className="range-slider" min={0} max={maxPrice} step={50}
              value={priceRange[i]}
              onChange={e => {
                const v = Number(e.target.value)
                if (i === 0 && v <= priceRange[1]) setPriceRange([v, priceRange[1]])
                if (i === 1 && v >= priceRange[0]) setPriceRange([priceRange[0], v])
              }} />
          </div>
        ))}
      </div>

      {/* Quick filters */}
      <div>
        <p className="sidebar-label">Quick Filters</p>
        {[{ label: 'Featured', value: 'featured' }, { label: 'In Stock', value: 'instock' }, { label: 'On Sale', value: 'sale' }].map(f => (
          <div key={f.label} className="check-row">
            <div className="check-box" />
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}