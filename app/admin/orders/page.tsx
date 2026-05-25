'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface OrderItem {
  name:        string
  category?:   string
  quantity:    number
  price:       number
  total?:      number
  image_url?:  string
  size?:       string
  color?:      string
  sku?:        string
  product_id?: string
  variant_id?: string | null
}
interface Customer {
  first_name: string | null; last_name: string | null
  email: string | null;      phone: string | null
}
interface Order {
  id:                  string
  order_number:        string
  total_amount:        number
  subtotal_amount?:    number
  shipping_amount?:    number
  coupon_code?:        string | null
  discount_amount?:    number
  status:              string
  payment_status:      string
  fulfillment_status:  string
  created_at:          string
  shipping_address:    any
  items:               OrderItem[]
  customers:           Customer | Customer[] | null
  payment_method?:     string
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ─── Status configs ──────────────────────────────────────────────────────── */
const ORDER_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(217,119,6,.1)',   text: '#b45309', dot: '#d97706' },
  confirmed:  { bg: 'rgba(37,99,235,.08)',  text: '#1d4ed8', dot: '#3b82f6' },
  processing: { bg: 'rgba(124,58,237,.08)', text: '#6d28d9', dot: '#8b5cf6' },
  shipped:    { bg: 'rgba(8,145,178,.08)',  text: '#0e7490', dot: '#06b6d4' },
  delivered:  { bg: 'rgba(22,163,74,.09)',  text: '#15803d', dot: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,.08)',  text: '#b91c1c', dot: '#dc2626' },
  refunded:   { bg: 'rgba(107,114,128,.08)',text: '#6b7280', dot: '#9ca3af' },
}
const PAYMENT_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'rgba(217,119,6,.1)',   text: '#b45309', dot: '#d97706' },
  authorized: { bg: 'rgba(37,99,235,.08)',  text: '#1d4ed8', dot: '#3b82f6' },
  captured:   { bg: 'rgba(22,163,74,.09)',  text: '#15803d', dot: '#16a34a' },
  failed:     { bg: 'rgba(220,38,38,.08)',  text: '#b91c1c', dot: '#dc2626' },
  refunded:   { bg: 'rgba(107,114,128,.08)',text: '#6b7280', dot: '#9ca3af' },
}
const FULFIL_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  unfulfilled:         { bg: 'rgba(217,119,6,.1)',   text: '#b45309', dot: '#d97706' },
  partially_fulfilled: { bg: 'rgba(124,58,237,.08)', text: '#6d28d9', dot: '#8b5cf6' },
  fulfilled:           { bg: 'rgba(22,163,74,.09)',  text: '#15803d', dot: '#16a34a' },
  returned:            { bg: 'rgba(220,38,38,.08)',  text: '#b91c1c', dot: '#dc2626' },
}

function StatusBadge({ cfg, val }: { cfg: Record<string, any>; val: string }) {
  const c = cfg[val] ?? { bg: '#f3f0ea', text: '#958a78', dot: '#d4cdbf' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:6,
      fontSize:11, fontWeight:700, letterSpacing:'.02em',
      background:c.bg, color:c.text, whiteSpace:'nowrap',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
      {val.replace(/_/g,' ')}
    </span>
  )
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  :root {
    --sand-50:#faf8f5;--sand-100:#f3f0ea;--sand-200:#e8e3d8;--sand-300:#d4cdbf;
    --sand-400:#b5ab98;--sand-500:#958a78;--sand-600:#756c5d;--sand-700:#524d43;
    --sand-800:#322f28;--ink:#14120e;--accent:#c8622a;--accent-lite:rgba(200,98,42,.1);
    --green:#16a34a;--red:#dc2626;--gold:#b8860b;--radius:10px;
    --font:'Instrument Sans',system-ui,sans-serif;
    --serif:'Instrument Serif',Georgia,serif;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  .ord-root{font-family:var(--font);color:var(--ink);animation:ord-in .35s ease both;}
  @keyframes ord-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .ord-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap;}
  .ord-title{font-family:var(--serif);font-size:26px;letter-spacing:-.02em;color:var(--ink);line-height:1;}
  .ord-eyebrow{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);margin-bottom:6px;}
  .ord-subtitle{font-size:12.5px;color:var(--sand-400);margin-top:5px;font-weight:500;}

  /* Stats */
  .ord-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px;}
  @media(max-width:900px){.ord-stats{grid-template-columns:repeat(2,1fr);}}
  .stat-card{background:white;border:1px solid var(--sand-200);border-radius:var(--radius);padding:14px 18px;transition:box-shadow .18s,transform .18s;}
  .stat-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);transform:translateY(-1px);}
  .stat-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sand-400);margin-bottom:6px;}
  .stat-value{font-size:26px;font-weight:700;letter-spacing:-.03em;line-height:1;}
  .stat-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;margin-bottom:10px;}

  /* Toolbar */
  .ord-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
  .search-box{position:relative;flex:1;min-width:180px;max-width:280px;}
  .search-box svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--sand-400);pointer-events:none;}
  .search-input{display:block;width:100%;border:1px solid var(--sand-200);border-radius:8px;padding:8px 30px 8px 34px;font-size:13px;font-family:var(--font);color:var(--ink);background:white;outline:none;transition:border-color .15s,box-shadow .15s;}
  .search-input::placeholder{color:var(--sand-300);}
  .search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-lite);}
  .search-clear{position:absolute;right:9px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--sand-400);font-size:13px;padding:2px;transition:color .15s;}
  .filter-scroll{display:flex;gap:5px;flex-wrap:wrap;}
  .filter-pill{height:32px;padding:0 12px;border:1px solid var(--sand-200);border-radius:7px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:var(--font);background:white;color:var(--sand-500);transition:all .15s;display:flex;align-items:center;gap:5px;white-space:nowrap;text-transform:capitalize;}
  .filter-pill:hover{border-color:var(--sand-300);color:var(--ink);}
  .filter-pill.active{background:var(--ink);color:white;border-color:var(--ink);}
  .filter-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
  .sort-select{height:32px;padding:0 10px;margin-left:auto;background:white;border:1px solid var(--sand-200);border-radius:8px;font-size:12px;color:var(--sand-600);font-family:var(--font);outline:none;cursor:pointer;}
  .result-count{font-size:12px;color:var(--sand-400);font-weight:500;white-space:nowrap;}

  /* Cards */
  .ord-card{background:white;border:1px solid var(--sand-200);border-radius:14px;overflow:hidden;transition:border-color .18s,box-shadow .18s;animation:card-rise .3s ease both;}
  @keyframes card-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .ord-card:hover{border-color:var(--sand-300);box-shadow:0 4px 20px rgba(0,0,0,.07);}
  .ord-card.deleting{opacity:.4;pointer-events:none;}
  .card-head{padding:14px 18px 12px;border-bottom:1px solid var(--sand-100);display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;background:var(--sand-50);}
  .order-num{font-size:13.5px;font-weight:700;color:var(--ink);font-family:monospace;letter-spacing:.01em;}
  .order-date{font-size:11px;color:var(--sand-400);margin-top:3px;font-family:monospace;}
  .badge-row{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:4px;}
  .order-amount{font-size:18px;font-weight:700;color:var(--ink);font-family:monospace;white-space:nowrap;margin-left:auto;align-self:flex-start;}
  .cust-row{padding:12px 18px;border-bottom:1px solid var(--sand-100);display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .cust-avatar{width:34px;height:34px;border-radius:9px;flex-shrink:0;background:var(--sand-100);border:1px solid var(--sand-200);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--sand-600);}
  .cust-name{font-size:13.5px;font-weight:600;color:var(--ink);}
  .cust-email{font-size:11.5px;color:var(--sand-400);font-family:monospace;margin-top:2px;}
  .cust-phone{font-size:12px;color:var(--sand-500);margin-top:1px;}
  .cust-address{margin-left:auto;text-align:right;font-size:11.5px;color:var(--sand-400);font-family:monospace;display:flex;flex-direction:column;gap:1px;}
  .items-row{padding:12px 18px;border-bottom:1px solid var(--sand-100);}
  .items-label{font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sand-400);margin-bottom:8px;}
  .item-line{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--sand-100);}
  .item-line:last-child{border-bottom:none;}
  .item-thumb{width:36px;height:36px;border-radius:7px;overflow:hidden;background:var(--sand-100);border:1px solid var(--sand-200);flex-shrink:0;position:relative;}
  .item-info{flex:1;min-width:0;}
  .item-name{font-size:13px;color:var(--sand-700);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .item-meta{font-size:11px;color:var(--sand-400);margin-top:2px;display:flex;gap:6px;flex-wrap:wrap;}
  .item-pill{background:var(--sand-100);color:var(--sand-600);border-radius:4px;padding:1px 6px;font-size:10.5px;font-weight:600;}
  .item-qty{font-size:12px;color:var(--sand-400);font-family:monospace;white-space:nowrap;}
  .item-price{font-size:13px;font-weight:700;color:var(--ink);font-family:monospace;white-space:nowrap;}
  .controls-row{padding:12px 18px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .ord-select{height:32px;padding:0 10px;background:white;border:1px solid var(--sand-200);border-radius:7px;font-size:12px;color:var(--sand-600);font-family:var(--font);outline:none;cursor:pointer;text-transform:capitalize;}
  .ord-select option{text-transform:capitalize;}
  .del-wrap{margin-left:auto;display:flex;align-items:center;gap:8px;}
  .del-hint{font-size:11px;color:var(--sand-300);font-family:monospace;}
  .del-btn{height:32px;padding:0 13px;background:white;border:1px solid rgba(220,38,38,.2);border-radius:7px;font-size:12px;font-weight:600;color:var(--red);font-family:var(--font);cursor:pointer;transition:all .15s;white-space:nowrap;}
  .del-btn:hover:not(:disabled){background:rgba(220,38,38,.05);border-color:rgba(220,38,38,.35);}
  .del-btn:disabled{opacity:.35;cursor:not-allowed;color:var(--sand-300);border-color:var(--sand-100);}
  .del-confirm{display:inline-flex;align-items:center;gap:8px;padding:5px 10px;border-radius:7px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.18);}
  .del-confirm-text{font-size:12px;color:var(--red);font-weight:600;}
  .del-yes{padding:3px 10px;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:var(--font);background:var(--red);color:white;}
  .del-no{padding:3px 9px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;background:white;color:var(--sand-500);border:1px solid var(--sand-200);font-family:var(--font);}

  /* Invoice btn */
  .invoice-btn{height:32px;padding:0 13px;background:white;border:1px solid var(--sand-200);border-radius:7px;font-size:12px;font-weight:600;color:var(--sand-600);font-family:var(--font);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;white-space:nowrap;}
  .invoice-btn:hover{background:var(--sand-50);border-color:var(--gold);color:var(--gold);}

  /* Empty */
  .empty-state{padding:64px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;}
  .empty-icon{font-size:36px;opacity:.4;}
  .empty-title{font-size:14px;font-weight:600;color:var(--ink);}
  .empty-sub{font-size:13px;color:var(--sand-400);}

  /* Toast */
  .toast{position:fixed;bottom:22px;right:22px;z-index:200;display:flex;align-items:center;gap:9px;padding:11px 17px;border-radius:10px;font-size:13.5px;font-weight:600;box-shadow:0 8px 28px rgba(0,0,0,.14);animation:toast-in .25s cubic-bezier(.16,1,.3,1) both;pointer-events:none;max-width:340px;font-family:var(--font);}
  @keyframes toast-in{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
  .toast.ok{background:#15803d;color:white;}
  .toast.err{background:var(--red);color:white;}
  .toast.info{background:var(--ink);color:white;}
  .toast-icon{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0;}

  .spinner{animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}

  /* ════════════════════════════
     INVOICE MODAL
  ════════════════════════════ */
  .inv-overlay{
    position:fixed;inset:0;z-index:300;
    background:rgba(20,18,14,.72);
    display:flex;align-items:flex-start;justify-content:center;
    padding:20px 12px 40px;overflow-y:auto;
    animation:inv-ov-in .2s ease;
    backdrop-filter:blur(6px);
  }
  @keyframes inv-ov-in{from{opacity:0}to{opacity:1}}
  .inv-modal{
    width:100%;max-width:720px;
    background:#fff;border-radius:20px;
    overflow:hidden;
    animation:inv-modal-in .28s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow:0 32px 80px rgba(0,0,0,.3);
    font-family:var(--font);
    margin:auto;
  }
  @keyframes inv-modal-in{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}

  /* Invoice top bar */
  .inv-topbar{
    background:linear-gradient(135deg,#1a1410 0%,#2d2418 100%);
    padding:20px 28px;
    display:flex;align-items:center;justify-content:space-between;
    gap:16px;flex-wrap:wrap;
  }
  .inv-brand{color:#fff;}
  .inv-brand-name{font-family:var(--serif);font-size:22px;letter-spacing:-.01em;color:#fff;}
  .inv-brand-sub{font-size:9.5px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.4);margin-top:2px;}
  .inv-meta{text-align:right;}
  .inv-num{font-size:18px;font-weight:700;color:#fff;font-family:monospace;}
  .inv-date{font-size:11px;color:rgba(255,255,255,.45);margin-top:4px;font-family:monospace;}
  .inv-status-wrap{margin-top:8px;display:flex;justify-content:flex-end;}

  /* Invoice body */
  .inv-body{padding:24px 28px;}

  /* Parties */
  .inv-parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--sand-100);}
  @media(max-width:500px){.inv-parties{grid-template-columns:1fr;}}
  .inv-party-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--sand-400);margin-bottom:8px;}
  .inv-party-name{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:4px;}
  .inv-party-line{font-size:12.5px;color:var(--sand-500);line-height:1.65;}

  /* Items table */
  .inv-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  .inv-table thead tr{background:var(--sand-50);border-bottom:1.5px solid var(--sand-200);}
  .inv-table thead th{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sand-400);padding:9px 10px;text-align:left;}
  .inv-table thead th:last-child,.inv-table tbody td:last-child{text-align:right;}
  .inv-table thead th:nth-child(3),.inv-table tbody td:nth-child(3){text-align:center;}
  .inv-table tbody tr{border-bottom:1px solid var(--sand-100);}
  .inv-table tbody tr:last-child{border-bottom:none;}
  .inv-table tbody td{padding:10px 10px;vertical-align:middle;}
  .inv-item-img{width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--sand-100);border:1px solid var(--sand-200);flex-shrink:0;position:relative;}
  .inv-item-name{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:4px;}
  .inv-item-badges{display:flex;gap:4px;flex-wrap:wrap;}
  .inv-item-badge{font-size:10px;font-weight:600;padding:1px 7px;border-radius:4px;white-space:nowrap;}
  .inv-item-cat{background:rgba(184,134,11,.1);color:#8b6914;}
  .inv-item-size{background:rgba(37,99,235,.08);color:#1d4ed8;}
  .inv-item-color{background:rgba(22,163,74,.08);color:#15803d;}
  .inv-sku{font-size:10px;color:var(--sand-400);font-family:monospace;margin-top:3px;}

  /* Totals */
  .inv-totals{display:flex;justify-content:flex-end;margin-bottom:20px;}
  .inv-totals-box{width:240px;border:1px solid var(--sand-200);border-radius:10px;overflow:hidden;}
  .inv-total-row{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;font-size:12.5px;}
  .inv-total-row+.inv-total-row{border-top:1px solid var(--sand-100);}
  .inv-total-row.grand{background:var(--sand-50);font-weight:700;font-size:15px;}
  .inv-total-key{color:var(--sand-500);}
  .inv-total-val{font-weight:600;color:var(--ink);font-family:monospace;}
  .inv-total-row.grand .inv-total-val{color:var(--ink);font-size:17px;}

  /* Footer */
  .inv-footer{padding:16px 28px;background:var(--sand-50);border-top:1px solid var(--sand-200);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
  .inv-footer-text{font-size:12px;color:var(--sand-400);}
  .inv-footer-actions{display:flex;gap:8px;}
  .inv-print-btn{padding:8px 20px;background:var(--ink);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:7px;transition:all .18s;}
  .inv-print-btn:hover{background:#2d2418;}
  .inv-close-btn{padding:8px 16px;background:white;color:var(--sand-600);border:1px solid var(--sand-200);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .18s;}
  .inv-close-btn:hover{border-color:var(--sand-300);color:var(--ink);}

  @media print {
    .inv-overlay{position:static;background:none;padding:0;}
    .inv-modal{box-shadow:none;border-radius:0;}
    .inv-footer-actions,.ord-root{display:none !important;}
    .inv-overlay *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  }
`

const STATUS_FILTERS = ['all','pending','confirmed','processing','shipped','delivered','cancelled','refunded']

/* ─── Invoice Component ─────────────────────────────────────────────────── */
function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const c = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const addr = order.shipping_address ?? {}
  const subtotal     = order.subtotal_amount  ?? order.items.reduce((s, i) => s + (i.total ?? i.price * i.quantity), 0)
  const shipping     = order.shipping_amount  ?? 0
  const couponCode   = order.coupon_code ?? null
  const discount     = Number(order.discount_amount) || 0
  const total        = order.total_amount

  const handlePrint = () => window.print()

  return (
    <div className="inv-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="inv-modal" id="invoice-printable">

        {/* Top bar */}
        <div className="inv-topbar">
          <div className="inv-brand">
            <div className="inv-brand-name">Shazfa Kraft</div>
            <div className="inv-brand-sub">Islamic Wall Art Store</div>
          </div>
          <div className="inv-meta">
            <div className="inv-num">{order.order_number}</div>
            <div className="inv-date">{fmtDate(order.created_at)}</div>
            <div className="inv-status-wrap">
              <StatusBadge cfg={ORDER_CFG} val={order.status} />
            </div>
          </div>
        </div>

        <div className="inv-body">

          {/* Parties */}
          <div className="inv-parties">
            <div>
              <div className="inv-party-label">Bill To / Ship To</div>
              <div className="inv-party-name">{[c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Customer'}</div>
              {c?.email && <div className="inv-party-line">{c.email}</div>}
              {(c?.phone || addr.phone) && <div className="inv-party-line">{c?.phone || addr.phone}</div>}
              {addr.address && <div className="inv-party-line" style={{ marginTop:6 }}>{addr.address}</div>}
              {(addr.city || addr.state) && (
                <div className="inv-party-line">
                  {[addr.city, addr.state].filter(Boolean).join(', ')}
                  {addr.pincode || addr.zip ? ` — ${addr.pincode || addr.zip}` : ''}
                </div>
              )}
            </div>
            <div>
              <div className="inv-party-label">From</div>
              <div className="inv-party-name">Shazfa Kraft</div>
              <div className="inv-party-line">India</div>
              <div style={{ marginTop:12 }}>
                <div className="inv-party-label">Payment</div>
                <div className="inv-party-line" style={{ fontWeight:600, color:'var(--ink)' }}>
                  {order.payment_method?.toUpperCase() ?? 'COD'}
                </div>
                <div style={{ marginTop:4 }}>
                  <StatusBadge cfg={PAYMENT_CFG} val={order.payment_status} />
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width:52 }}></th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="inv-item-img">
                      {item.image_url
                        ? <Image src={item.image_url} alt={item.name} fill style={{ objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📦</div>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="inv-item-name">{item.name}</div>
                    <div className="inv-item-badges">
                      {item.category && <span className="inv-item-badge inv-item-cat">{item.category}</span>}
                      {item.size     && <span className="inv-item-badge inv-item-size">📐 {item.size}"</span>}
                      {item.color    && (
                        <span className="inv-item-badge inv-item-color">
                          <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:item.color, border:'1px solid rgba(0,0,0,.15)', marginRight:3, verticalAlign:'middle' }} />
                          {item.color}
                        </span>
                      )}
                    </div>
                    {item.sku && <div className="inv-sku">SKU: {item.sku}</div>}
                  </td>
                  <td style={{ textAlign:'center', fontFamily:'monospace', fontSize:13, fontWeight:600 }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'monospace', fontSize:13, fontWeight:600, color:'var(--sand-600)' }}>
                    {fmt(item.price)}
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:13.5, fontWeight:700, color:'var(--ink)' }}>
                    {fmt(item.total ?? item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="inv-totals">
            <div className="inv-totals-box">
              <div className="inv-total-row">
                <span className="inv-total-key">Subtotal</span>
                <span className="inv-total-val">{fmt(subtotal)}</span>
              </div>
              <div className="inv-total-row">
                <span className="inv-total-key">Shipping</span>
                <span className="inv-total-val">{shipping === 0 ? 'Free' : fmt(shipping)}</span>
              </div>
              {couponCode && discount > 0 && (
                <div className="inv-total-row" style={{ color:'#15803d' }}>
                  <span className="inv-total-key">
                    Discount <span style={{ fontWeight:700, fontFamily:'monospace', fontSize:11 }}>({couponCode})</span>
                  </span>
                  <span className="inv-total-val" style={{ color:'#15803d' }}>−{fmt(discount)}</span>
                </div>
              )}
              <div className="inv-total-row grand">
                <span>Total</span>
                <span className="inv-total-val">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment */}
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <StatusBadge cfg={FULFIL_CFG} val={order.fulfillment_status} />
          </div>
          <div style={{ fontSize:12, color:'var(--sand-400)', fontFamily:'monospace' }}>
            Est. delivery: 3–7 business days &nbsp;·&nbsp; Dispatched from: Shazfa Kraft
          </div>
        </div>

        {/* Footer */}
        <div className="inv-footer">
          <div className="inv-footer-text">Thank you for your order! 🌟</div>
          <div className="inv-footer-actions">
            <button className="inv-close-btn" onClick={onClose}>Close</button>
            <button className="inv-print-btn" onClick={handlePrint}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState<Order[]>([])
  const [loading,       setLoading]       = useState(true)
  const [deletingId,    setDeletingId]    = useState<string|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [toast,         setToast]         = useState<{ msg:string; type:'ok'|'err'|'info' }|null>(null)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [sortKey,       setSortKey]       = useState('newest')
  const [invoiceOrder,  setInvoiceOrder]  = useState<Order|null>(null)

  const showToast = (msg: string, type: 'ok'|'err'|'info' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id,order_number,total_amount,subtotal_amount,shipping_amount,coupon_code,discount_amount,status,payment_status,fulfillment_status,created_at,shipping_address,items,payment_method,customers(first_name,last_name,email,phone)')
      .order('created_at', { ascending: false })
    if (error) { showToast('Failed to load orders: ' + error.message, 'err'); setLoading(false); return }
    setOrders((data || []) as Order[])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateOrder = async (id: string, updates: Record<string, string>) => {
    const supabase = createClient()
    const { error } = await supabase.from('orders').update(updates).eq('id', id)
    if (error) { showToast('Update failed: ' + error.message, 'err'); return }
    await fetchOrders()
    showToast('Order updated', 'ok')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id); setDeleteConfirm(null)
    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    setDeletingId(null)
    if (error) { showToast('Delete failed: ' + error.message, 'err'); return }
    await fetchOrders()
    if (invoiceOrder?.id === id) setInvoiceOrder(null)
    showToast('Order deleted', 'ok')
  }

  const filtered = orders
    .filter(o => {
      const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
      const q = search.toLowerCase()
      const matchQ = !q || [o.order_number, c?.first_name, c?.last_name, c?.email, c?.phone].some(v => v?.toLowerCase().includes(q))
      const matchS = statusFilter === 'all' || o.status === statusFilter
      return matchQ && matchS
    })
    .sort((a, b) => {
      if (sortKey === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortKey === 'amount') return b.total_amount - a.total_amount
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue:   orders.filter(o => !['cancelled','refunded'].includes(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0),
  }

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:260, gap:12, fontFamily:'var(--font)' }}>
        <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sand-300)" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span style={{ fontSize:13, color:'var(--sand-400)', fontWeight:500 }}>Loading orders…</span>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>

      {/* Invoice Modal */}
      {invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}

      <div className="ord-root">
        {toast && (
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">{toast.type==='ok'?'✓':toast.type==='err'?'✕':'i'}</div>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="ord-header">
          <div>
            <p className="ord-eyebrow">Commerce</p>
            <h1 className="ord-title">Orders</h1>
            <p className="ord-subtitle">{orders.length} total orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="ord-stats">
          {[
            { label:'Total Orders', value:stats.total,        color:'var(--ink)',   icon:'📦', iconBg:'var(--sand-100)' },
            { label:'Pending',      value:stats.pending,      color:'#b45309',      icon:'⏳', iconBg:'rgba(217,119,6,.1)' },
            { label:'Delivered',    value:stats.delivered,    color:'var(--green)', icon:'✅', iconBg:'rgba(22,163,74,.09)' },
            { label:'Net Revenue',  value:fmt(stats.revenue), color:'var(--ink)',   icon:'₹',  iconBg:'var(--sand-100)', mono:true },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background:s.iconBg }}>{s.icon}</div>
              <div className="stat-value" style={{ color:s.color, fontFamily:s.mono?'monospace':'inherit', fontSize:s.mono?20:26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="ord-toolbar">
          <div className="search-box">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="search" className="search-input" placeholder="Search order, customer…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="filter-scroll">
            {STATUS_FILTERS.map(s => (
              <button key={s} className={`filter-pill ${statusFilter===s?'active':''}`} onClick={() => setStatusFilter(s)}>
                {s!=='all' && <span className="filter-dot" style={{ background:ORDER_CFG[s]?.dot??'var(--sand-300)' }} />}
                {s==='all'?'All':s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortKey} onChange={e => setSortKey(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Highest amount</option>
          </select>
          <span className="result-count">{filtered.length} / {orders.length}</span>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ background:'white', border:'1px solid var(--sand-200)', borderRadius:14, overflow:'hidden' }}>
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No orders found</div>
              <div className="empty-sub">Try adjusting your search or filters</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((o, i) => {
              const c = Array.isArray(o.customers) ? o.customers[0] : o.customers
              const isDeleting   = deletingId === o.id
              const isConfirming = deleteConfirm === o.id
              const initials  = `${c?.first_name?.charAt(0)??''}${c?.last_name?.charAt(0)??''}` || '?'

              return (
                <div key={o.id} className={`ord-card ${isDeleting?'deleting':''}`} style={{ animationDelay:`${i*.04}s` }}>

                  {/* Header */}
                  <div className="card-head">
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="order-num">{o.order_number}</div>
                      <div className="order-date">{fmtDate(o.created_at)}</div>
                      <div className="badge-row">
                        <StatusBadge cfg={ORDER_CFG}   val={o.status} />
                        <StatusBadge cfg={PAYMENT_CFG} val={o.payment_status} />
                        <StatusBadge cfg={FULFIL_CFG}  val={o.fulfillment_status} />
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                      <div className="order-amount">{fmt(o.total_amount)}</div>
                      <button className="invoice-btn" onClick={() => setInvoiceOrder(o)}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        View Invoice
                      </button>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="cust-row">
                    <div className="cust-avatar">{initials}</div>
                    <div>
                      <div className="cust-name">{c?.first_name} {c?.last_name}</div>
                      <div className="cust-email">{c?.email||'—'}</div>
                      {c?.phone && <div className="cust-phone">{c.phone}</div>}
                    </div>
                    {o.shipping_address && (
                      <div className="cust-address">
                        <span>{o.shipping_address.address||o.shipping_address.street||''}</span>
                        <span>{[o.shipping_address.city,o.shipping_address.state,o.shipping_address.pincode||o.shipping_address.zip].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Items — now with thumbnails, size, color, category */}
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div className="items-row">
                      <div className="items-label">{o.items.length} item{o.items.length!==1?'s':''}</div>
                      {o.items.map((it, idx) => (
                        <div key={idx} className="item-line">
                          <div className="item-thumb">
                            {it.image_url
                              ? <Image src={it.image_url} alt={it.name} fill style={{ objectFit:'cover' }} />
                              : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>📦</div>
                            }
                          </div>
                          <div className="item-info">
                            <div className="item-name">{it.name||'Item'}</div>
                            <div className="item-meta">
                              {it.category && <span className="item-pill">{it.category}</span>}
                              {it.size     && <span className="item-pill">📐 {it.size}"</span>}
                              {it.color    && <span className="item-pill">🎨 {it.color}</span>}
                            </div>
                          </div>
                          <span className="item-qty">× {it.quantity||1}</span>
                          <span className="item-price">{fmt(it.total??(Number(it.price||0)*Number(it.quantity||1)))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="controls-row">
                    {[
                      { key:'status',             options:['pending','confirmed','processing','shipped','delivered','cancelled','refunded'],    val:o.status,             label:'Status' },
                      { key:'payment_status',     options:['pending','authorized','captured','failed','refunded'],                             val:o.payment_status,     label:'Payment' },
                      { key:'fulfillment_status', options:['unfulfilled','partially_fulfilled','fulfilled','returned'],                        val:o.fulfillment_status, label:'Fulfillment' },
                    ].map(sel => (
                      <select key={sel.key} className="ord-select" value={sel.val}
                        onChange={e => updateOrder(o.id, { [sel.key]: e.target.value })}>
                        {sel.options.map(opt => (
                          <option key={opt} value={opt}>{sel.label}: {opt.replace(/_/g,' ')}</option>
                        ))}
                      </select>
                    ))}
                    <div className="del-wrap">
                      {isConfirming ? (
                        <div className="del-confirm">
                          <span className="del-confirm-text">Delete permanently?</span>
                          <button className="del-yes" disabled={isDeleting} onClick={() => handleDelete(o.id)}>{isDeleting?'…':'Yes'}</button>
                          <button className="del-no" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button className="del-btn" disabled={isDeleting} onClick={() => setDeleteConfirm(o.id)}>
                          {isDeleting ? (
                            <svg className="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display:'inline',verticalAlign:'middle',marginRight:4 }}>
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                          ) : (
                            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display:'inline',verticalAlign:'middle',marginRight:4 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          )}
                          {isDeleting?'Deleting…':'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}