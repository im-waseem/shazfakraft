import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddBannerForm from './add-banner-form'
import BannerList from './banner-list'

export default async function BannerManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: banners, error } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching banners:', error)
  }

  return (
    <div style={{
      minHeight: '100%',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@700;800&display=swap');

        @keyframes page-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .banner-page-wrap { animation: page-rise 0.4s cubic-bezier(.4,0,.2,1) both; }

        .banner-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          overflow: hidden;
          animation: card-rise 0.45s cubic-bezier(.4,0,.2,1) both;
        }
        .banner-card:nth-child(1) { animation-delay: 0.1s; }
        .banner-card:nth-child(2) { animation-delay: 0.2s; }

        .card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex; align-items: center; gap: 12px;
        }
        .card-header-icon {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          box-shadow: 0 4px 12px rgba(255,107,53,0.3);
          flex-shrink: 0;
        }
        .card-body { padding: 24px; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 14px; border-radius: 11px;
          font-size: 13px; font-weight: 600;
          color: #5c5850;
          background: #f0ede8;
          border: 1px solid rgba(0,0,0,0.07);
          text-decoration: none;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
        }
        .back-btn:hover {
          background: #e8e4de;
          color: #1a1916;
          transform: translateX(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .back-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="banner-page-wrap">
        {/* Page Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ff6b35', marginBottom: 4 }}>
              Content Management
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26, fontWeight: 800, color: '#1a1916',
              letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0,
            }}>Manage Banners</h1>
            <p style={{ fontSize: 13.5, color: '#8a8680', marginTop: 5, fontWeight: 400 }}>
              Create and manage coupon banners for the homepage
            </p>
          </div>
          <a href="/admin" className="back-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>

        {/* Stat strip */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Total Banners', value: banners?.length ?? 0, color: '#ff6b35' },
            { label: 'Active', value: banners?.filter((b: any) => b.is_active !== false).length ?? 0, color: '#10b981' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#ffffff', borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.07)',
              padding: '14px 20px', minWidth: 120,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b0aba4', margin: 0 }}>
                {stat.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 800, color: stat.color, margin: '4px 0 0', fontFamily: "'Playfair Display', serif" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 780, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Add Banner Form */}
          <div className="banner-card">
            <div className="card-header">
              <div className="card-header-icon">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1916', margin: 0 }}>Add New Banner</h2>
                <p style={{ fontSize: 12, color: '#b0aba4', margin: '2px 0 0' }}>Fill in the details below</p>
              </div>
            </div>
            <div className="card-body">
              <AddBannerForm />
            </div>
          </div>

          {/* Banners List */}
          <div className="banner-card">
            <div className="card-header">
              <div className="card-header-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1916', margin: 0 }}>All Banners</h2>
                <p style={{ fontSize: 12, color: '#b0aba4', margin: '2px 0 0' }}>{banners?.length ?? 0} banners total</p>
              </div>
            </div>
            <div className="card-body">
              <BannerList banners={banners || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}