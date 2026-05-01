'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  billing_address: any
  shipping_address: any
  total_orders: number
  total_spent: number
  last_order_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  email: string
}

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const supabase = createClient()

    // First, try to get customers with auth user emails via join
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && !error) {
      // Fetch emails from auth.users for each customer
      const customersWithEmail = await Promise.all(
        data.map(async (customer) => {
          // Try to get email from auth user (not available on client, so use fallback)
          const { data: authData } = { data: null }

          return {
            ...customer,
            email: (authData as any)?.user?.email || customer.email || 'N/A',
          }
        })
      )
      setCustomers(customersWithEmail)
    } else {
      // Fallback: try alternate query structure
      const { data: fallbackData } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallbackData) {
        setCustomers(fallbackData.map(c => ({ ...c, email: c.email || 'N/A' })))
      }
    }
    setLoading(false)
  }

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetails(true)
  }

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000) return 'VIP'
    if (totalSpent >= 500) return 'Premium'
    if (totalSpent >= 100) return 'Regular'
    return 'New'
  }

  const getTierConfig = (tier: string) => {
    const config: { [key: string]: { bg: string; text: string; dot: string } } = {
      VIP:     { bg: 'bg-amber-50 border border-amber-200',    text: 'text-amber-700', dot: 'bg-amber-400' },
      Premium: { bg: 'bg-violet-50 border border-violet-200',  text: 'text-violet-700', dot: 'bg-violet-400' },
      Regular: { bg: 'bg-sky-50 border border-sky-200',        text: 'text-sky-700', dot: 'bg-sky-400' },
      New:     { bg: 'bg-slate-50 border border-slate-200',    text: 'text-slate-600', dot: 'bg-slate-400' },
    }
    return config[tier] || config.New
  }

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase()
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  })

  const stats = {
    total: customers.length,
    vip: customers.filter(c => getCustomerTier(c.total_spent) === 'VIP').length,
    totalRevenue: customers.reduce((a, c) => a + (c.total_spent || 0), 0),
    activeToday: customers.filter(c => c.is_active).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase animate-pulse">
            Loading customers
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-white"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@300;400;500&display=swap');

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .anim-slide-down { animation: slideDown 0.4s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-in    { animation: fadeIn 0.5s ease both; }
        .anim-slide-up   { animation: slideUp 0.4s cubic-bezier(.16,1,.3,1) both; }
        .anim-scale-in   { animation: scaleIn 0.35s cubic-bezier(.16,1,.3,1) both; }

        .row-item { animation: slideUp 0.4s cubic-bezier(.16,1,.3,1) both; }

        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .glass-hover:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(139,92,246,0.3);
          transition: all 0.2s ease;
        }
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139,92,246,0.4);
        }
        .search-input:focus {
          outline: none;
          border-color: rgba(139,92,246,0.6);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .detail-panel {
          animation: scaleIn 0.3s cubic-bezier(.16,1,.3,1) both;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="anim-slide-down mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
              Admin Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Customers
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            {customers.length} total customers across all tiers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 anim-fade-in" style={{ animationDelay: '0.1s' }}>
          {[
            { label: 'Total Customers', value: stats.total, icon: '👥', accent: 'text-white' },
            { label: 'VIP Members',     value: stats.vip,   icon: '⭐', accent: 'text-amber-400' },
            { label: 'Active Now',      value: stats.activeToday, icon: '🟢', accent: 'text-emerald-400' },
            { label: 'Total Revenue',   value: `$${stats.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}`, icon: '💰', accent: 'text-violet-400' },
          ].map((s, i) => (
            <div key={s.label} className="stat-card rounded-2xl p-5" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-semibold ${s.accent} tabular-nums`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Customer Detail Panel */}
        {showDetails && selectedCustomer && (
          <div className="detail-panel glass rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-700/20 border border-violet-500/20 flex items-center justify-center text-xl font-semibold text-violet-300">
                  {selectedCustomer.first_name?.charAt(0)}{selectedCustomer.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h3>
                  <p className="text-slate-400 text-sm">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Contact</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">📞</span>
                    {selectedCustomer.phone || <span className="text-slate-600 italic">Not provided</span>}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">📅</span>
                    Since {new Date(selectedCustomer.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Orders</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Orders</span>
                    <span className="text-white font-semibold tabular-nums">{selectedCustomer.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="text-violet-300 font-semibold tabular-nums">${selectedCustomer.total_spent?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Order</span>
                    <span className="text-white text-xs">
                      {selectedCustomer.last_order_date
                        ? new Date(selectedCustomer.last_order_date).toLocaleDateString()
                        : <span className="text-slate-600">Never</span>}
                    </span>
                  </div>
                </div>
              </div>

              {selectedCustomer.billing_address && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>Billing Address</p>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>{selectedCustomer.billing_address.street}</p>
                    <p>{selectedCustomer.billing_address.city}, {selectedCustomer.billing_address.state} {selectedCustomer.billing_address.zip}</p>
                    <p className="text-slate-500">{selectedCustomer.billing_address.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="glass rounded-2xl overflow-hidden anim-slide-up" style={{ animationDelay: '0.15s' }}>
          {/* Table Header / Search */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400 font-medium">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'result' : 'results'}
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customers…"
                className="search-input bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 w-64 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Customer', 'Email', 'Phone', 'Orders', 'Total Spent', 'Tier', ''].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest"
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-slate-500">No customers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, i) => {
                    const tier = getCustomerTier(customer.total_spent)
                    const tierCfg = getTierConfig(tier)
                    return (
                      <tr
                        key={customer.id}
                        className="row-item glass-hover border-b border-white/[0.03] cursor-pointer"
                        style={{ animationDelay: `${0.05 + i * 0.04}s` }}
                        onClick={() => handleViewDetails(customer)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-violet-800/30 border border-violet-500/20 flex items-center justify-center text-sm font-semibold text-violet-300">
                                {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium text-white">
                              {customer.first_name} {customer.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-400" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {customer.email}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{customer.phone || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-white tabular-nums">{customer.total_orders}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-violet-300 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                            ${customer.total_spent?.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${tierCfg.bg} ${tierCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tierCfg.dot}`}></span>
                            {tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); handleViewDetails(customer) }}
                            className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-500/10"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}