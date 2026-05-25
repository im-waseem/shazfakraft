'use client'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
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

type SortKey = 'name' | 'total_spent' | 'total_orders' | 'created_at' | 'last_order_date'
type TierKey = 'All' | 'VIP' | 'Premium' | 'Regular' | 'New'
type ViewMode = 'table' | 'grid'

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getCustomerTier = (spent: number): TierKey => {
  if (spent >= 1000) return 'VIP'
  if (spent >= 500)  return 'Premium'
  if (spent >= 100)  return 'Regular'
  return 'New'
}

const TIER_CFG: Record<TierKey, { bg: string; text: string; dot: string; border: string }> = {
  All:     { bg: 'rgba(184,174,154,.08)',  text: '#998f7a', dot: '#b8ae9a', border: 'rgba(184,174,154,.2)' },
  VIP:     { bg: 'rgba(252,211,77,.1)',    text: '#d97706', dot: '#f59e0b', border: 'rgba(252,211,77,.25)' },
  Premium: { bg: 'rgba(167,139,250,.1)',   text: '#7c3aed', dot: '#8b5cf6', border: 'rgba(167,139,250,.2)' },
  Regular: { bg: 'rgba(56,189,248,.08)',   text: '#0284c7', dot: '#38bdf8', border: 'rgba(56,189,248,.2)' },
  New:     { bg: 'rgba(184,174,154,.06)',  text: '#998f7a', dot: '#b8ae9a', border: 'rgba(184,174,154,.15)' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

const fmtRelative = (s: string | null): string => {
  if (!s) return 'Never'
  const diff = Date.now() - new Date(s).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const formatInitials = (c: Customer) =>
  (c.first_name?.charAt(0) || '') + (c.last_name?.charAt(0) || '')

const AVATAR_COLORS = [
  '#7c3aed', '#d97706', '#0284c7', '#059669', '#dc2626', '#9333ea',
  '#0891b2', '#ca8a04', '#be185d', '#1d4ed8',
]

const getAvatarColor = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  :root {
    --sand-50:  #faf8f5;
    --sand-100: #f3f0ea;
    --sand-200: #e8e3d8;
    --sand-300: #d6cfc0;
    --sand-400: #b8ae9a;
    --sand-500: #998f7a;
    --sand-600: #7a7163;
    --sand-700: #5a5349;
    --sand-800: #3d3830;
    --sand-900: #201e19;
    --ink:      #14120e;
    --accent:   #c8622a;
    --accent-2: #e07a3d;
    --accent-dim: rgba(200,98,42,.12);
  }

  .cust-root {
    font-family: 'Instrument Sans', system-ui, sans-serif;
    color: var(--ink);
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

  .anim-up   { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .anim-in   { animation: fadeIn .4s ease both; }
  .anim-scale{ animation: scaleIn .35s cubic-bezier(.16,1,.3,1) both; }
  .anim-slide{ animation: slideUp .3s ease both; }

  /* ── Header ── */
  .cust-header { margin-bottom: 28px; }
  .cust-header-top {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  }
  .cust-title-row {
    display: flex; align-items: center; gap: 10px;
  }
  .cust-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 28px; font-weight: 400;
    color: var(--ink);
    letter-spacing: -.02em;
    line-height: 1.2;
  }
  .cust-subtitle {
    font-size: 13px; color: var(--sand-500);
    margin-top: 4px;
  }
  .cust-header-actions {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 34px; padding: 0 14px;
    border-radius: 8px;
    font-size: 12.5px; font-weight: 600;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    cursor: pointer; transition: all .18s; white-space: nowrap;
    letter-spacing: -.01em;
  }
  .btn-primary {
    background: var(--ink); color: white;
    border: none;
  }
  .btn-primary:hover {
    background: var(--sand-800);
    box-shadow: 0 4px 12px rgba(0,0,0,.15);
    transform: translateY(-1px);
  }
  .btn-secondary {
    background: white; color: var(--sand-600);
    border: 1px solid var(--sand-200);
  }
  .btn-secondary:hover {
    border-color: var(--sand-300);
    color: var(--ink);
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
  }
  .btn-ghost {
    background: transparent; color: var(--sand-500);
    border: 1px solid transparent;
  }
  .btn-ghost:hover { background: var(--sand-100); color: var(--ink); }
  .btn-danger {
    background: rgba(220,38,38,.08); color: #dc2626;
    border: 1px solid rgba(220,38,38,.15);
  }
  .btn-danger:hover { background: rgba(220,38,38,.12); border-color: rgba(220,38,38,.25); }
  .btn-icon {
    width: 34px; padding: 0;
    display: inline-flex; align-items: center; justify-content: center;
  }

  /* ── Stats grid ── */
  .cust-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px; margin-bottom: 22px;
  }
  @media(max-width:768px){ .cust-stats{ grid-template-columns:1fr 1fr; } }
  @media(max-width:480px){ .cust-stats{ grid-template-columns:1fr; } }
  .cust-stat {
    background: white;
    border: 1px solid var(--sand-200);
    border-radius: 12px; padding: 16px 18px;
    transition: all .2s;
    position: relative; overflow: hidden;
  }
  .cust-stat:hover {
    border-color: var(--sand-300);
    box-shadow: 0 4px 16px rgba(0,0,0,.06);
    transform: translateY(-1px);
  }
  .cust-stat-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cust-stat-info { min-width: 0; }
  .cust-stat-label {
    font-size: 11px; color: var(--sand-400);
    font-weight: 600; letter-spacing: .03em;
    text-transform: uppercase; margin-bottom: 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cust-stat-val {
    font-size: 24px; font-weight: 700;
    letter-spacing: -.03em; line-height: 1.1;
    font-family: 'Instrument Sans', system-ui, sans-serif;
  }
  .cust-stat-icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }

  /* ── Toolbar ── */
  .cust-toolbar {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 16px; flex-wrap: wrap;
  }
  .cust-search-wrap {
    position: relative; flex: 1; min-width: 220px; max-width: 340px;
  }
  .cust-search-icon {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    color: var(--sand-400); pointer-events: none;
    display: flex;
  }
  .cust-search {
    width: 100%; height: 36px;
    padding: 0 11px 0 36px;
    background: white;
    border: 1px solid var(--sand-200);
    border-radius: 9px;
    font-size: 12.5px; color: var(--ink);
    font-family: 'Instrument Sans', system-ui, sans-serif;
    outline: none; transition: all .18s;
  }
  .cust-search::placeholder { color: var(--sand-400); }
  .cust-search:focus {
    border-color: var(--sand-400);
    box-shadow: 0 0 0 3px rgba(20,18,14,.06);
  }

  .cust-view-toggle {
    display: flex; gap: 2px; padding: 2px;
    background: var(--sand-100); border-radius: 8px;
    border: 1px solid var(--sand-200);
  }
  .cust-view-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px; border: none;
    background: transparent; color: var(--sand-400);
    cursor: pointer; transition: all .15s;
  }
  .cust-view-btn.active { background: white; color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .cust-view-btn:hover:not(.active) { color: var(--sand-600); }

  /* Tier filter pills */
  .cust-filters { display: flex; gap: 4px; flex-wrap: wrap; }
  .cust-filter-btn {
    height: 30px; padding: 0 10px;
    border-radius: 7px; border: 1px solid var(--sand-200);
    font-size: 11px; font-weight: 600; cursor: pointer;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    background: white; color: var(--sand-500);
    transition: all .15s; letter-spacing: .01em;
    display: flex; align-items: center; gap: 4px;
    white-space: nowrap;
  }
  .cust-filter-btn:hover { border-color: var(--sand-300); color: var(--ink); }
  .cust-filter-btn.active {
    background: var(--ink); color: white;
    border-color: var(--ink);
  }

  .cust-sort {
    height: 30px; padding: 0 8px 0 10px;
    background: white;
    border: 1px solid var(--sand-200);
    border-radius: 7px;
    font-size: 11px; color: var(--sand-600);
    font-family: 'Instrument Sans', system-ui, sans-serif;
    outline: none; cursor: pointer;
    transition: border-color .15s;
    font-weight: 500;
  }
  .cust-sort:focus { border-color: var(--sand-400); }

  /* ── Card ── */
  .cust-card {
    background: white;
    border: 1px solid var(--sand-200);
    border-radius: 14px; overflow: hidden;
    transition: box-shadow .2s;
  }
  .cust-card-top {
    padding: 12px 18px;
    border-bottom: 1px solid var(--sand-100);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cust-results-count {
    font-size: 12px; color: var(--sand-500);
    font-weight: 500;
  }
  .cust-results-count strong { color: var(--ink); font-weight: 600; }
  .cust-selected-info {
    font-size: 11px; color: var(--accent);
    font-weight: 600;
    display: flex; align-items: center; gap: 4px;
  }

  /* ── Table ── */
  .cust-tbl-wrap { overflow-x: auto; }
  .cust-tbl { width: 100%; border-collapse: collapse; }
  .cust-tbl thead tr { border-bottom: 1px solid var(--sand-100); }
  .cust-tbl th {
    padding: 10px 16px;
    text-align: left;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .08em;
    color: var(--sand-400);
    white-space: nowrap;
    user-select: none;
  }
  .cust-tbl th:last-child { text-align: right; }
  .cust-tbl th.sortable { cursor: pointer; transition: color .15s; }
  .cust-tbl th.sortable:hover { color: var(--ink); }
  .cust-tbl th .sort-arrow {
    display: inline-block; margin-left: 3px; font-size: 8px;
    opacity: .3;
  }
  .cust-tbl th .sort-arrow.active { opacity: 1; }
  .cust-tbl tbody tr {
    border-bottom: 1px solid var(--sand-100);
    cursor: pointer;
    transition: background .12s;
  }
  .cust-tbl tbody tr:last-child { border-bottom: none; }
  .cust-tbl tbody tr:hover { background: var(--sand-50); }
  .cust-tbl tbody tr.selected { background: rgba(200,98,42,.06); }
  .cust-tbl td { padding: 12px 16px; vertical-align: middle; }
  .cust-tbl td:last-child { text-align: right; }
  .cust-tbl td:first-child { padding-left: 18px; }
  .cust-tbl th:first-child { padding-left: 18px; }

  /* Checkbox */
  .cust-checkbox {
    width: 16px; height: 16px; border-radius: 4px;
    border: 1.5px solid var(--sand-300);
    background: white;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s; flex-shrink: 0;
    -webkit-appearance: none; appearance: none;
  }
  .cust-checkbox:checked {
    background: var(--ink); border-color: var(--ink);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: center; background-size: 9px;
  }
  .cust-checkbox-wrap {
    display: flex; align-items: center; gap: 8px;
  }

  /* Customer name cell */
  .cust-name-cell { display: flex; align-items: center; gap: 10px; }
  .cust-avatar {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    object-fit: cover;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }
  .cust-avatar-inactive { opacity: .5; }
  .cust-name-primary { font-size: 13px; font-weight: 600; color: var(--ink); }
  .cust-name-id {
    font-size: 9.5px; color: var(--sand-400);
    font-family: 'SF Mono', 'Cascadia Code', monospace; margin-top: 1px;
  }
  .cust-email {
    font-size: 12px; color: var(--sand-500);
    font-family: 'SF Mono', 'Cascadia Code', monospace;
    max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cust-phone { font-size: 12px; color: var(--sand-500); }
  .cust-orders-val {
    font-size: 13px; font-weight: 700; color: var(--ink);
    font-family: 'SF Mono', 'Cascadia Code', monospace;
  }
  .cust-spent-val {
    font-size: 13px; font-weight: 700; color: var(--sand-700);
    font-family: 'SF Mono', 'Cascadia Code', monospace;
  }
  .cust-tier-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: .02em;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .cust-tier-dot { width: 4px; height: 4px; border-radius: 50%; }
  .cust-action-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 600;
    color: var(--sand-600); background: transparent;
    border: 1px solid var(--sand-200);
    cursor: pointer; font-family: 'Instrument Sans', system-ui, sans-serif;
    transition: all .15s; white-space: nowrap;
  }
  .cust-action-btn:hover {
    background: var(--sand-50);
    color: var(--ink); border-color: var(--sand-300);
  }
  .cust-active-dot {
    width: 6px; height: 6px; border-radius: 50%;
    display: inline-block; margin-right: 4px;
  }
  .cust-last-seen {
    font-size: 10.5px; color: var(--sand-400);
    font-weight: 500;
  }

  /* ── Grid view ── */
  .cust-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px; padding: 16px;
  }
  .cust-grid-card {
    background: white;
    border: 1px solid var(--sand-200);
    border-radius: 12px; padding: 16px;
    cursor: pointer;
    transition: all .2s;
    position: relative;
  }
  .cust-grid-card:hover {
    border-color: var(--sand-300);
    box-shadow: 0 4px 16px rgba(0,0,0,.06);
    transform: translateY(-1px);
  }
  .cust-grid-card.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .cust-grid-card-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .cust-grid-card-body {
    display: flex; flex-direction: column; gap: 6px;
  }
  .cust-grid-stat {
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 0; font-size: 12px;
  }
  .cust-grid-stat-label { color: var(--sand-400); }
  .cust-grid-stat-val { color: var(--ink); font-weight: 600; }
  .cust-grid-card-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 6px;
    margin-top: 12px; padding-top: 10px;
    border-top: 1px solid var(--sand-100);
  }

  /* ── Detail panel (slide-in) ── */
  .cust-detail-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(20,18,14,.3);
    backdrop-filter: blur(2px);
    animation: fadeIn .2s ease both;
  }
  .cust-detail-panel {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 101;
    width: 480px; max-width: 100vw;
    background: white;
    border-left: 1px solid var(--sand-200);
    box-shadow: -8px 0 32px rgba(0,0,0,.08);
    display: flex; flex-direction: column;
    animation: slideIn .35s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

  .cust-detail-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--sand-100);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    flex-shrink: 0;
  }
  .cust-detail-avatar {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .cust-detail-name { font-size: 16px; font-weight: 700; color: var(--ink); }
  .cust-detail-email { font-size: 12px; color: var(--sand-500); font-family: 'SF Mono', 'Cascadia Code', monospace; margin-top: 2px; }
  .cust-detail-close {
    width: 30px; height: 30px; border-radius: 7px;
    background: var(--sand-50); border: 1px solid var(--sand-200);
    display: flex; align-items: center; justify-content: center;
    color: var(--sand-500); cursor: pointer; transition: all .15s;
    font-size: 14px; flex-shrink: 0;
  }
  .cust-detail-close:hover { background: var(--sand-100); color: var(--ink); }

  .cust-detail-body {
    flex: 1; overflow-y: auto; padding: 20px 22px 24px;
  }
  .cust-detail-section { margin-bottom: 20px; }
  .cust-detail-section:last-child { margin-bottom: 0; }
  .cust-detail-section-title {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .1em;
    color: var(--sand-400); margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .cust-detail-section-title::after {
    content: ''; flex: 1; height: 1px; background: var(--sand-100);
  }
  .cust-detail-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 6px 0; font-size: 12.5px;
  }
  .cust-detail-key { color: var(--sand-500); }
  .cust-detail-val { color: var(--ink); font-weight: 500; }
  .cust-detail-val.mono { font-family: 'SF Mono', 'Cascadia Code', monospace; }
  .cust-detail-val.accent { color: var(--accent); }
  .cust-detail-val.green  { color: #059669; }
  .cust-detail-val.red    { color: #dc2626; }

  .cust-detail-actions {
    display: flex; flex-direction: column; gap: 6px;
    margin-top: 16px;
  }
  .cust-detail-action-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px; border-radius: 8px;
    border: 1px solid var(--sand-200);
    background: white; color: var(--ink);
    font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: all .15s;
    font-family: 'Instrument Sans', system-ui, sans-serif;
  }
  .cust-detail-action-btn:hover {
    background: var(--sand-50);
    border-color: var(--sand-300);
  }
  .cust-detail-action-btn.red { color: #dc2626; }
  .cust-detail-action-btn.red:hover { background: rgba(220,38,38,.06); border-color: rgba(220,38,38,.2); }
  .cust-detail-action-btn.green { color: #059669; }
  .cust-detail-action-btn.green:hover { background: rgba(5,150,105,.06); border-color: rgba(5,150,105,.2); }

  /* ── Empty ── */
  .cust-empty {
    padding: 56px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .cust-empty-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--sand-100); border: 1px solid var(--sand-200);
    display: flex; align-items: center; justify-content: center;
    color: var(--sand-400); margin-bottom: 4px;
  }
  .cust-empty-title { font-size: 14px; font-weight: 600; color: var(--sand-600); }
  .cust-empty-sub   { font-size: 12px; color: var(--sand-400); }

  /* ── Skeleton ── */
  .cust-skel-row {
    display: flex; gap: 12px; padding: 12px 18px;
    border-bottom: 1px solid var(--sand-100);
  }
  .cust-skel-row:last-child { border-bottom: none; }
  .cust-skel {
    border-radius: 6px;
    background: linear-gradient(90deg,
      var(--sand-100) 25%,
      var(--sand-200) 50%,
      var(--sand-100) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  /* ── Pagination ── */
  .cust-pagination {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px; border-top: 1px solid var(--sand-100);
    gap: 12px; flex-wrap: wrap;
  }
  .cust-page-info {
    font-size: 11.5px; color: var(--sand-500);
  }
  .cust-page-btns {
    display: flex; gap: 3px;
  }
  .cust-page-btn {
    width: 30px; height: 30px; border-radius: 7px;
    border: 1px solid var(--sand-200);
    background: white; color: var(--sand-600);
    font-size: 11.5px; font-weight: 600;
    cursor: pointer; transition: all .15s;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    display: flex; align-items: center; justify-content: center;
  }
  .cust-page-btn:hover { border-color: var(--sand-300); color: var(--ink); }
  .cust-page-btn.active { background: var(--ink); color: white; border-color: var(--ink); }
  .cust-page-btn:disabled { opacity: .3; cursor: default; }
  .cust-page-btn:disabled:hover { border-color: var(--sand-200); color: var(--sand-600); }

  /* ── Toast ── */
  .cust-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 200;
    padding: 12px 18px; border-radius: 10px;
    font-size: 13px; font-weight: 600;
    background: var(--ink); color: white;
    box-shadow: 0 8px 24px rgba(0,0,0,.15);
    display: flex; align-items: center; gap: 8px;
    animation: slideUp .3s ease both, fadeIn .3s ease .18s both;
  }
  .cust-toast.success { background: #059669; }
  .cust-toast.error { background: #dc2626; }

  /* ── Modal ── */
  .cust-modal-overlay {
    position: fixed; inset: 0; z-index: 150;
    background: rgba(20,18,14,.4);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn .15s ease both;
  }
  .cust-modal {
    background: white; border-radius: 14px;
    width: 100%; max-width: 400px;
    box-shadow: 0 16px 48px rgba(0,0,0,.12);
    padding: 24px;
    animation: scaleIn .25s cubic-bezier(.16,1,.3,1) both;
  }
  .cust-modal h3 {
    font-size: 16px; font-weight: 700; margin-bottom: 8px;
  }
  .cust-modal p {
    font-size: 13px; color: var(--sand-600); margin-bottom: 20px; line-height: 1.5;
  }
  .cust-modal-actions {
    display: flex; gap: 8px; justify-content: flex-end;
  }

  /* ── Scrollbar ── */
  .cust-detail-body::-webkit-scrollbar,
  .cust-tbl-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
  .cust-detail-body::-webkit-scrollbar-track,
  .cust-tbl-wrap::-webkit-scrollbar-track { background: transparent; }
  .cust-detail-body::-webkit-scrollbar-thumb,
  .cust-tbl-wrap::-webkit-scrollbar-thumb { background: var(--sand-200); border-radius: 2px; }
`

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function CustomersManagementPage() {
  const [customers, setCustomers]           = useState<Customer[]>([])
  const [loading, setLoading]               = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery]       = useState('')
  const [tierFilter, setTierFilter]         = useState<TierKey>('All')
  const [sortKey, setSortKey]               = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc]               = useState(false)
  const [viewMode, setViewMode]             = useState<ViewMode>('table')
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [page, setPage]                     = useState(1)
  const [pageSize]                          = useState(20)
  const [toast, setToast]                   = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [deleting, setDeleting]             = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchCustomers() }, [])

  /* ── Toast helper ── */
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  /* ── Fetch ── */
  const fetchCustomers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (data && !error) {
      setCustomers(data.map((c: any) => ({ ...c, email: c.email || 'N/A' })))
    }
    setLoading(false)
  }

  /* ── Toggle active status ── */
  const toggleActive = async (customer: Customer) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .update({ is_active: !customer.is_active, updated_at: new Date().toISOString() })
      .eq('id', customer.id)
    if (!error) {
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_active: !c.is_active, updated_at: new Date().toISOString() } : c))
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
      showToast(`${customer.first_name} ${customer.is_active ? 'deactivated' : 'activated'} successfully`)
    } else {
      showToast('Failed to update customer', 'error')
    }
  }

  /* ── Delete customer ── */
  const deleteCustomer = async () => {
    if (!showDeleteModal) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', showDeleteModal)
    if (!error) {
      setCustomers(prev => prev.filter(c => c.id !== showDeleteModal))
      if (selectedCustomer?.id === showDeleteModal) setSelectedCustomer(null)
      selectedIds.delete(showDeleteModal)
      showToast('Customer deleted successfully')
      setShowDeleteModal(null)
    } else {
      showToast('Failed to delete customer', 'error')
    }
    setDeleting(false)
  }

  /* ── Filter + sort ── */
  const filtered = useMemo(() =>
    customers
      .filter(c => {
        const q = searchQuery.toLowerCase()
        const matchQ = !q || [c.first_name, c.last_name, c.email, c.phone]
          .some(v => v?.toLowerCase().includes(q))
        const matchT = tierFilter === 'All' || getCustomerTier(c.total_spent) === tierFilter
        return matchQ && matchT
      })
      .sort((a, b) => {
        let cmp: number
        if (sortKey === 'name')           cmp = (a.first_name ?? '').localeCompare(b.first_name ?? '')
        else if (sortKey === 'total_spent')  cmp = a.total_spent - b.total_spent
        else if (sortKey === 'total_orders') cmp = a.total_orders - b.total_orders
        else if (sortKey === 'last_order_date') cmp = (a.last_order_date ?? '').localeCompare(b.last_order_date ?? '')
        else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return sortAsc ? cmp : -cmp
      }),
    [customers, searchQuery, tierFilter, sortKey, sortAsc]
  )

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => { setPage(1) }, [searchQuery, tierFilter])

  /* ── Export CSV ── */
  const exportCSV = useCallback(() => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Tier', 'Status', 'Last Order Date', 'Member Since']
    const rows = filtered.map(c => [
      c.first_name || '', c.last_name || '', c.email, c.phone || '',
      String(c.total_orders), String(c.total_spent), getCustomerTier(c.total_spent),
      c.is_active ? 'Active' : 'Inactive', c.last_order_date || '', c.created_at
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `customers-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${rows.length} customers to CSV`)
  }, [filtered.length])

  /* ── Selection helpers ── */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedCustomers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paginatedCustomers.map(c => c.id)))
  }
  const bulkToggleActive = async () => {
    const supabase = createClient()
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    const { error } = await supabase.from('customers').update({ updated_at: new Date().toISOString() }).in('id', ids)
    if (!error) {
      setCustomers(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, updated_at: new Date().toISOString() } : c))
      showToast(`Updated ${ids.length} customers`)
      setSelectedIds(new Set())
    } else showToast('Bulk update failed', 'error')
  }

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:   customers.length,
    vip:     customers.filter(c => getCustomerTier(c.total_spent) === 'VIP').length,
    active:  customers.filter(c => c.is_active).length,
    revenue: customers.reduce((s, c) => s + (c.total_spent || 0), 0),
  }), [customers])

  const STATS = useMemo(() => [
    { label: 'Total Customers', value: stats.total,         color: '#14120e', icon: '👥', iconBg: 'var(--sand-100)' },
    { label: 'VIP Members',     value: stats.vip,           color: '#d97706', icon: '⭐', iconBg: 'rgba(251,191,36,.1)' },
    { label: 'Active Now',      value: stats.active,        color: '#059669', icon: '🟢', iconBg: 'rgba(5,150,105,.08)' },
    { label: 'Total Revenue',   value: fmt(stats.revenue),  color: '#c8622a', icon: '₹',  iconBg: 'rgba(200,98,42,.1)' },
  ], [stats])

  const TIERS: TierKey[] = ['All', 'VIP', 'Premium', 'Regular', 'New']

  /* ── Handle view ── */
  const handleView = (customer: Customer) => {
    setSelectedCustomer(prev => prev?.id === customer.id ? null : customer)
  }

  /* ── Handle sort ── */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(key === 'created_at' ? false : true) }
  }

  const SortArrow = ({ col }: { col: SortKey }) => (
    <span className={`sort-arrow ${sortKey === col ? 'active' : ''}`}>
      {sortKey === col ? (sortAsc ? '▲' : '▼') : '▾'}
    </span>
  )

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="cust-root">
        <style>{CSS}</style>
        <div className="anim-slide">
          <div className="cust-header">
            <div className="cust-title" style={{ background: 'var(--sand-200)', borderRadius: 6, display: 'inline-block' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            <div className="cust-subtitle" style={{ marginTop: 8 }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
          </div>
          <div className="cust-stats">
            {[1,2,3,4].map(i => (
              <div key={i} className="cust-stat" style={{ padding: '18px' }}>
                <div className="cust-skel" style={{ width: 36, height: 36, borderRadius: 9, marginBottom: 12 }}/>
                <div className="cust-skel" style={{ width: '60%', height: 26, marginBottom: 6 }}/>
                <div className="cust-skel" style={{ width: '40%', height: 12 }}/>
              </div>
            ))}
          </div>
          <div className="cust-card">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="cust-skel-row">
                <div className="cust-skel" style={{ width: 34, height: 34, borderRadius: 9 }}/>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="cust-skel" style={{ width: '40%', height: 14 }}/>
                  <div className="cust-skel" style={{ width: '25%', height: 10 }}/>
                </div>
                <div className="cust-skel" style={{ width: '18%', height: 14 }}/>
                <div className="cust-skel" style={{ width: '10%', height: 14 }}/>
                <div className="cust-skel" style={{ width: '14%', height: 14 }}/>
                <div className="cust-skel" style={{ width: '12%', height: 22, borderRadius: 5 }}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cust-root">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div className="cust-header anim-up">
        <div className="cust-header-top">
          <div>
            <div className="cust-title-row">
              <h1 className="cust-title">Customers</h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: 'var(--sand-100)', color: 'var(--sand-600)',
                marginTop: 4,
              }}>
                {customers.length}
              </span>
            </div>
            <p className="cust-subtitle">{stats.active} active · {stats.vip} VIP · {fmt(stats.revenue)} total revenue</p>
          </div>
          <div className="cust-header-actions">
            <button className="btn btn-secondary" onClick={exportCSV}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => window.location.href = '/admin/orders'}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              View Orders
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="cust-stats anim-in" style={{ animationDelay: '.06s' }}>
        {STATS.map((s, i) => (
          <div key={s.label} className="cust-stat" style={{ animationDelay: `${.04 * i}s` }}>
            <div className="cust-stat-row">
              <div className="cust-stat-info">
                <div className="cust-stat-label">{s.label}</div>
                <div className="cust-stat-val" style={{ color: s.color }}>{s.value}</div>
              </div>
              <div className="cust-stat-icon" style={{ background: s.iconBg }}>
                <span>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="cust-toolbar anim-up" style={{ animationDelay: '.1s' }}>
        <div className="cust-search-wrap">
          <span className="cust-search-icon">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            className="cust-search"
            type="text"
            placeholder="Search customers…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cust-filters">
          {TIERS.map(t => (
            <button
              key={t}
              className={`cust-filter-btn ${tierFilter === t ? 'active' : ''}`}
              onClick={() => setTierFilter(t)}
            >
              {t !== 'All' && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: tierFilter === t ? 'white' : TIER_CFG[t].dot,
                  display: 'inline-block',
                }}/>
              )}
              {t}
            </button>
          ))}
        </div>

        <select
          className="cust-sort"
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
        >
          <option value="created_at">Newest</option>
          <option value="total_spent">Highest spend</option>
          <option value="total_orders">Most orders</option>
          <option value="name">Name A–Z</option>
          <option value="last_order_date">Last order</option>
        </select>

        <div className="cust-view-toggle">
          <button
            className={`cust-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table view"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </button>
          <button
            className={`cust-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Bulk actions ── */}
      {selectedIds.size > 0 && (
        <div className="anim-slide" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', background: 'rgba(200,98,42,.06)',
          border: '1px solid rgba(200,98,42,.15)',
          borderRadius: 9, marginBottom: 12,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
            {selectedIds.size} selected
          </span>
          <span style={{ flex: 1 }}/>
          <button className="btn btn-secondary" onClick={bulkToggleActive}>
            Update Activity
          </button>
          <button className="btn btn-ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {viewMode === 'table' ? (
        <div className="cust-card anim-scale" style={{ animationDelay: '.14s' }}>
          <div className="cust-card-top">
            <span className="cust-results-count">
              <strong>{filtered.length}</strong> / {customers.length} customers
              {tierFilter !== 'All' && <span style={{ color: 'var(--sand-400)' }}> · {tierFilter} tier</span>}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ fontSize: 11.5, color: 'var(--sand-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear search
              </button>
            )}
          </div>

          <div className="cust-tbl-wrap">
            <table className="cust-tbl">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      className="cust-checkbox"
                      checked={paginatedCustomers.length > 0 && selectedIds.size === paginatedCustomers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    Customer <SortArrow col="name"/>
                  </th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="sortable" onClick={() => handleSort('total_orders')}>
                    Orders <SortArrow col="total_orders"/>
                  </th>
                  <th className="sortable" onClick={() => handleSort('total_spent')}>
                    Spent <SortArrow col="total_spent"/>
                  </th>
                  <th>Tier</th>
                  <th className="sortable" onClick={() => handleSort('last_order_date')}>
                    Last Order <SortArrow col="last_order_date"/>
                  </th>
                  <th>Status</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="cust-empty">
                        <div className="cust-empty-icon">
                          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        </div>
                        <div className="cust-empty-title">No customers found</div>
                        <div className="cust-empty-sub">Try adjusting your search or filters</div>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCustomers.map((c, i) => {
                  const tier = getCustomerTier(c.total_spent)
                  const cfg  = TIER_CFG[tier]
                  const isSelected = selectedCustomer?.id === c.id
                  const avatarColor = getAvatarColor(c.id)
                  return (
                    <tr
                      key={c.id}
                      className={isSelected ? 'selected' : ''}
                      style={{ animation: `fadeUp .35s cubic-bezier(.16,1,.3,1) ${.02 + i * .025}s both` }}
                      onClick={() => handleView(c)}
                    >
                      <td onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="cust-checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                        />
                      </td>
                      <td>
                        <div className="cust-name-cell">
                          {c.avatar_url
                            ? <img src={c.avatar_url} alt="" className={`cust-avatar ${!c.is_active ? 'cust-avatar-inactive' : ''}`} />
                            : (
                              <div className={`cust-avatar ${!c.is_active ? 'cust-avatar-inactive' : ''}`} style={{ background: avatarColor }}>
                                {formatInitials(c)}
                              </div>
                            )
                          }
                          <div>
                            <div className="cust-name-primary" style={{ opacity: c.is_active ? 1 : .5 }}>
                              {c.first_name} {c.last_name}
                            </div>
                            <div className="cust-name-id">#{c.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td><div className="cust-email">{c.email}</div></td>
                      <td><span className="cust-phone">{c.phone || '—'}</span></td>
                      <td><span className="cust-orders-val">{c.total_orders}</span></td>
                      <td><span className="cust-spent-val">{fmt(c.total_spent)}</span></td>
                      <td>
                        <span className="cust-tier-badge" style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
                          <span className="cust-tier-dot" style={{ background: cfg.dot }}/>
                          {tier}
                        </span>
                      </td>
                      <td>
                        <span className="cust-last-seen">{fmtRelative(c.last_order_date)}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11.5, color: c.is_active ? '#059669' : 'var(--sand-400)' }}>
                          <span className="cust-active-dot" style={{ background: c.is_active ? '#059669' : 'var(--sand-300)' }}/>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="cust-action-btn"
                          onClick={e => { e.stopPropagation(); handleView(c) }}
                        >
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="cust-pagination">
              <span className="cust-page-info">
                Page {page} of {totalPages} · {filtered.length} total
              </span>
              <div className="cust-page-btns">
                <button className="cust-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pg = start + i
                  if (pg > totalPages) return null
                  return (
                    <button
                      key={pg}
                      className={`cust-page-btn ${pg === page ? 'active' : ''}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  )
                })}
                <button className="cust-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Grid view ── */
        <div className="cust-card anim-scale" style={{ animationDelay: '.14s' }}>
          <div className="cust-card-top">
            <span className="cust-results-count">
              <strong>{filtered.length}</strong> / {customers.length} customers
              {tierFilter !== 'All' && <span style={{ color: 'var(--sand-400)' }}> · {tierFilter} tier</span>}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ fontSize: 11.5, color: 'var(--sand-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear search
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="cust-empty">
              <div className="cust-empty-icon">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div className="cust-empty-title">No customers found</div>
              <div className="cust-empty-sub">Try adjusting your search or filters</div>
            </div>
          ) : (
            <div className="cust-grid">
              {paginatedCustomers.map((c, i) => {
                const tier = getCustomerTier(c.total_spent)
                const cfg  = TIER_CFG[tier]
                const isSelected = selectedCustomer?.id === c.id
                const avatarColor = getAvatarColor(c.id)
                return (
                  <div
                    key={c.id}
                    className={`cust-grid-card ${isSelected ? 'selected' : ''}`}
                    style={{ animation: `fadeUp .35s cubic-bezier(.16,1,.3,1) ${.02 + i * .03}s both` }}
                    onClick={() => handleView(c)}
                  >
                    <div className="cust-grid-card-header">
                      <div className="cust-checkbox-wrap" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="cust-checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                        />
                      </div>
                      {c.avatar_url
                        ? <img src={c.avatar_url} alt="" className={`cust-avatar ${!c.is_active ? 'cust-avatar-inactive' : ''}`} style={{ width: 38, height: 38, borderRadius: 10 }} />
                        : (
                          <div className={`cust-avatar ${!c.is_active ? 'cust-avatar-inactive' : ''}`} style={{ background: avatarColor, width: 38, height: 38, borderRadius: 10 }}>
                            {formatInitials(c)}
                          </div>
                        )
                      }
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="cust-name-primary" style={{ fontSize: 13, opacity: c.is_active ? 1 : .5 }}>
                          {c.first_name} {c.last_name}
                        </div>
                        <div className="cust-email" style={{ fontSize: 11 }}>{c.email}</div>
                      </div>
                    </div>
                    <div className="cust-grid-card-body">
                      <div className="cust-grid-stat">
                        <span className="cust-grid-stat-label">Orders</span>
                        <span className="cust-grid-stat-val">{c.total_orders}</span>
                      </div>
                      <div className="cust-grid-stat">
                        <span className="cust-grid-stat-label">Spent</span>
                        <span className="cust-grid-stat-val">{fmt(c.total_spent)}</span>
                      </div>
                      <div className="cust-grid-stat">
                        <span className="cust-grid-stat-label">Last Order</span>
                        <span className="cust-grid-stat-val" style={{ color: 'var(--sand-500)', fontWeight: 500 }}>{fmtRelative(c.last_order_date)}</span>
                      </div>
                      <div className="cust-grid-stat">
                        <span className="cust-grid-stat-label">Status</span>
                        <span style={{ fontSize: 11.5, color: c.is_active ? '#059669' : 'var(--sand-400)', fontWeight: 600 }}>
                          <span className="cust-active-dot" style={{ background: c.is_active ? '#059669' : 'var(--sand-300)' }}/>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="cust-grid-card-footer">
                      <span className="cust-tier-badge" style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
                        <span className="cust-tier-dot" style={{ background: cfg.dot }}/>
                        {tier}
                      </span>
                      <span style={{ flex: 1 }}/>
                      <button className="cust-action-btn" onClick={e => { e.stopPropagation(); handleView(c) }}>
                        Profile
                      </button>
                      <button className="cust-action-btn" onClick={e => { e.stopPropagation(); toggleActive(c) }} style={{ color: c.is_active ? '#dc2626' : '#059669' }}>
                        {c.is_active ? 'Deact.' : 'Act.'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination (grid) */}
          {totalPages > 1 && (
            <div className="cust-pagination">
              <span className="cust-page-info">
                Page {page} of {totalPages} · {filtered.length} total
              </span>
              <div className="cust-page-btns">
                <button className="cust-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pg = start + i
                  if (pg > totalPages) return null
                  return (
                    <button
                      key={pg}
                      className={`cust-page-btn ${pg === page ? 'active' : ''}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  )
                })}
                <button className="cust-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail slide-in panel ── */}
      {selectedCustomer && (
        <>
          <div className="cust-detail-overlay" onClick={() => setSelectedCustomer(null)} />
          <div className="cust-detail-panel" ref={detailRef}>
            <div className="cust-detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div className="cust-detail-avatar" style={{ background: getAvatarColor(selectedCustomer.id) }}>
                  {formatInitials(selectedCustomer)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="cust-detail-name">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                    {' '}
                    <span className="cust-tier-badge" style={{
                      background: TIER_CFG[getCustomerTier(selectedCustomer.total_spent)].bg,
                      color: TIER_CFG[getCustomerTier(selectedCustomer.total_spent)].text,
                      borderColor: TIER_CFG[getCustomerTier(selectedCustomer.total_spent)].border,
                      verticalAlign: 'middle',
                    }}>
                      <span className="cust-tier-dot" style={{ background: TIER_CFG[getCustomerTier(selectedCustomer.total_spent)].dot }}/>
                      {getCustomerTier(selectedCustomer.total_spent)}
                    </span>
                  </div>
                  <div className="cust-detail-email">{selectedCustomer.email}</div>
                </div>
              </div>
              <button className="cust-detail-close" onClick={() => setSelectedCustomer(null)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="cust-detail-body">
              {/* Contact */}
              <div className="cust-detail-section">
                <div className="cust-detail-section-title">Contact</div>
                {[
                  { k: 'Phone',    v: selectedCustomer.phone || '—' },
                  { k: 'Status',   v: selectedCustomer.is_active ? 'Active' : 'Inactive',
                    cls: selectedCustomer.is_active ? 'green' : 'red' },
                  { k: 'Member since', v: fmtDate(selectedCustomer.created_at) ?? '—' },
                  { k: 'Last updated', v: fmtDate(selectedCustomer.updated_at) ?? '—' },
                ].map(r => (
                  <div key={r.k} className="cust-detail-row">
                    <span className="cust-detail-key">{r.k}</span>
                    <span className={`cust-detail-val mono ${r.cls ?? ''}`}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Order History */}
              <div className="cust-detail-section">
                <div className="cust-detail-section-title">Order History</div>
                {[
                  { k: 'Total Orders', v: String(selectedCustomer.total_orders) },
                  { k: 'Total Spent',  v: fmt(selectedCustomer.total_spent), cls: 'accent' },
                  { k: 'Avg Order Value', v: selectedCustomer.total_orders > 0
                    ? fmt(selectedCustomer.total_spent / selectedCustomer.total_orders) : '—', cls: 'accent' },
                  { k: 'Last Order',   v: fmtDate(selectedCustomer.last_order_date) ?? 'Never' },
                ].map(r => (
                  <div key={r.k} className="cust-detail-row">
                    <span className="cust-detail-key">{r.k}</span>
                    <span className={`cust-detail-val mono ${r.cls ?? ''}`}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Billing Address */}
              <div className="cust-detail-section">
                <div className="cust-detail-section-title">Billing Address</div>
                {selectedCustomer.billing_address ? (
                  <>
                    {[
                      { k: 'Street', v: selectedCustomer.billing_address.street },
                      { k: 'City',   v: selectedCustomer.billing_address.city },
                      { k: 'State',  v: `${selectedCustomer.billing_address.state || ''} ${selectedCustomer.billing_address.zip || ''}`.trim() },
                      { k: 'Country',v: selectedCustomer.billing_address.country },
                    ].map(r => r.v ? (
                      <div key={r.k} className="cust-detail-row">
                        <span className="cust-detail-key">{r.k}</span>
                        <span className="cust-detail-val mono">{r.v}</span>
                      </div>
                    ) : null)}
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'var(--sand-400)', fontStyle: 'italic' }}>No address on file</p>
                )}
              </div>

              {/* Shipping Address */}
              {selectedCustomer.shipping_address && (
                <div className="cust-detail-section">
                  <div className="cust-detail-section-title">Shipping Address</div>
                  {[
                    { k: 'Street', v: selectedCustomer.shipping_address.street },
                    { k: 'City',   v: selectedCustomer.shipping_address.city },
                    { k: 'State',  v: `${selectedCustomer.shipping_address.state || ''} ${selectedCustomer.shipping_address.zip || ''}`.trim() },
                    { k: 'Country',v: selectedCustomer.shipping_address.country },
                  ].map(r => r.v ? (
                    <div key={r.k} className="cust-detail-row">
                      <span className="cust-detail-key">{r.k}</span>
                      <span className="cust-detail-val mono">{r.v}</span>
                    </div>
                  ) : null)}
                </div>
              )}

              {/* Actions */}
              <div className="cust-detail-section" style={{ marginTop: 24 }}>
                <div className="cust-detail-section-title">Actions</div>
                <div className="cust-detail-actions">
                  <button
                    className={`cust-detail-action-btn ${selectedCustomer.is_active ? 'red' : 'green'}`}
                    onClick={() => toggleActive(selectedCustomer)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                        d={selectedCustomer.is_active
                          ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
                      />
                    </svg>
                    {selectedCustomer.is_active ? 'Deactivate Customer' : 'Activate Customer'}
                  </button>
                  <button
                    className="cust-detail-action-btn red"
                    onClick={() => setShowDeleteModal(selectedCustomer.id)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Delete Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="cust-modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="cust-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Customer</h3>
            <p>
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="cust-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={deleteCustomer} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`cust-toast ${toast.type}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toast.type === 'success'
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            }
          </svg>
          {toast.msg}
        </div>
      )}
    </div>
  )
}