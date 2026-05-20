'use client'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Category { id: string; name: string; slug: string }
interface ProductVariant {
  id: string; product_id: string; sku: string | null; name: string | null
  price: number; compare_price: number | null; cost_price: number | null
  inventory_quantity: number; options: { size_inches?: string; color?: string }
  position: number; is_active: boolean; image_url?: string | null
  color_hex?: string | null
}
interface Product {
  id: string; name: string; slug: string; description: string
  short_description: string; sku: string; price: number
  compare_price: number | null; category_id: string | null
  main_image_url: string; images: string[]; inventory_quantity: number
  track_inventory: boolean; is_active: boolean; is_featured: boolean
  option_keys: string[]; created_at: string
  categories?: Category | null; variants?: ProductVariant[]
}

/* ─── Split variant row: size+price on left, color+image on right ─────────── */
type SizeRow = {
  id: string
  size_inches: string
  sku: string
  price: number
  compare_price: number
  inventory_quantity: number
  is_active: boolean
  _isNew?: boolean
  _delete?: boolean
}
type ColorRow = {
  id: string
  color: string
  image_url: string
  color_hex: string
  _isNew?: boolean
  _delete?: boolean
}

/* ─── Constants ───────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2)
const INCH_PRESETS = ['6x8','8x10','9x12','12x16','16x20','18x24','24x32','24x36']
const COLOR_OPTIONS = [
  { name: 'Gold',      hex: '#c9a84c' },
  { name: 'Silver',    hex: '#a8a8a8' },
  { name: 'Black',     hex: '#1a1a1a' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Bronze',    hex: '#a0714f' },
  { name: 'White',     hex: '#e8e8e8' },
]
const COLOR_HEX: Record<string, string> = {
  gold: '#d4a843', silver: '#c0c0c0', black: '#1a1a1a',
  white: '#f5f5f0', 'rose gold': '#b76e79', bronze: '#cd7f32',
}
const EMPTY_FORM = {
  name: '', slug: '', description: '', short_description: '', sku: '',
  price: 0, compare_price: 0, category_id: '', main_image_url: '',
  images: ['','','',''],
  inventory_quantity: 0, track_inventory: true, is_active: true,
  is_featured: false, option_keys: ['size_inches','color'],
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  :root {
    --sand-50:  #faf8f5; --sand-100: #f3f0ea; --sand-200: #e8e3d8;
    --sand-300: #d4cdbf; --sand-400: #b5ab98; --sand-500: #958a78;
    --sand-600: #756c5d; --sand-700: #524d43; --sand-800: #322f28;
    --ink: #14120e; --accent: #c8622a; --accent-lite: rgba(200,98,42,.1);
    --green: #16a34a; --amber: #d97706; --red: #dc2626;
    --radius: 10px;
    --font: 'Instrument Sans', system-ui, sans-serif;
    --serif: 'Instrument Serif', Georgia, serif;
  }
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
  .products-root { font-family: var(--font); color: var(--ink); }
  /* STAT CARDS */
  .stat-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; }
  @media(max-width:1100px){.stat-grid{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:700px){.stat-grid{grid-template-columns:repeat(2,1fr)}}
  .stat-card { background:white; border:1px solid var(--sand-200); border-radius:var(--radius); padding:16px 18px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; transition:box-shadow .18s,transform .18s; }
  .stat-card:hover{box-shadow:0 4px 18px rgba(0,0,0,.07);transform:translateY(-1px)}
  .stat-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sand-400);margin-bottom:6px}
  .stat-value{font-size:28px;font-weight:700;line-height:1;letter-spacing:-.03em}
  .stat-sub{font-size:11px;color:var(--sand-400);margin-top:4px;font-weight:500}
  .stat-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
  /* PAGE HEADER */
  .page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
  .page-title{font-family:var(--serif);font-size:26px;letter-spacing:-.02em;color:var(--ink);line-height:1}
  .page-subtitle{font-size:12.5px;color:var(--sand-400);margin-top:4px;font-weight:500}
  /* BUTTONS */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:var(--font);font-size:13px;font-weight:600;border-radius:8px;cursor:pointer;border:none;outline:none;transition:all .18s;letter-spacing:-.01em;white-space:nowrap}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{background:var(--ink);color:white;padding:9px 16px;box-shadow:0 1px 4px rgba(0,0,0,.12)}
  .btn-primary:hover:not(:disabled){background:var(--sand-800);box-shadow:0 4px 14px rgba(0,0,0,.18);transform:translateY(-1px)}
  .btn-ghost{background:white;color:var(--sand-700);border:1px solid var(--sand-200);padding:8px 14px}
  .btn-ghost:hover:not(:disabled){border-color:var(--sand-300);background:var(--sand-50)}
  .btn-danger{background:white;color:var(--red);border:1px solid rgba(220,38,38,.2);padding:8px 12px}
  .btn-danger:hover:not(:disabled){background:rgba(220,38,38,.05);border-color:rgba(220,38,38,.35)}
  .btn-sm{padding:6px 11px !important;font-size:12px !important}
  .btn-icon-sm{width:30px;height:30px;padding:0 !important;border-radius:7px !important;background:white;color:var(--sand-500);border:1px solid var(--sand-200)}
  .btn-icon-sm:hover{color:var(--ink);border-color:var(--sand-300)}
  /* INPUTS */
  .inp{display:block;width:100%;border:1px solid var(--sand-200);border-radius:8px;padding:9px 13px;font-size:13.5px;font-family:var(--font);color:var(--ink);background:white;outline:none;transition:border-color .15s,box-shadow .15s;line-height:1.4}
  .inp::placeholder{color:var(--sand-300)}
  .inp:hover{border-color:var(--sand-300)}
  .inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-lite)}
  .inp-sm{border:1px solid var(--sand-200);border-radius:7px;padding:5px 9px;font-size:12px;font-family:var(--font);color:var(--ink);background:white;outline:none;transition:border-color .15s,box-shadow .15s}
  .inp-sm:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-lite)}
  /* TOGGLE */
  .toggle-wrap{display:flex;align-items:center;gap:9px;cursor:pointer;user-select:none}
  .toggle-track{width:38px;height:22px;border-radius:11px;transition:background .2s;flex-shrink:0;position:relative}
  .toggle-track.on{background:var(--ink)}.toggle-track.off{background:var(--sand-200)}
  .toggle-thumb{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:left .2s cubic-bezier(.34,1.56,.64,1)}
  .toggle-track.on .toggle-thumb{left:19px}.toggle-track.off .toggle-thumb{left:3px}
  .toggle-label{font-size:13px;font-weight:500;color:var(--sand-700)}
  /* SECTION HEADING */
  .section-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .section-head-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--sand-400);white-space:nowrap}
  .section-head-line{flex:1;height:1px;background:var(--sand-200)}
  /* FORM PANEL */
  .form-panel{background:white;border:1px solid var(--sand-200);border-radius:14px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.06);animation:slide-down .3s cubic-bezier(.16,1,.3,1)}
  @keyframes slide-down{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
  .form-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--sand-100);background:var(--sand-50)}
  .form-title{font-family:var(--serif);font-size:18px;letter-spacing:-.02em}
  .form-subtitle{font-size:12px;color:var(--sand-400);margin-top:2px}
  .form-body{padding:24px 22px}
  .form-section{margin-bottom:28px}
  .form-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .form-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  @media(max-width:900px){.form-grid-4{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.form-grid-4,.form-grid-2{grid-template-columns:1fr}}
  .form-label{display:block;font-size:11.5px;font-weight:600;color:var(--sand-700);margin-bottom:6px;letter-spacing:-.01em}
  .form-label .req{color:var(--accent)}
  .col-span-2{grid-column:span 2}.col-span-4{grid-column:span 4}
  .form-toggles{display:flex;flex-wrap:wrap;gap:20px;padding-top:16px;border-top:1px solid var(--sand-100);margin-top:16px}
  .form-actions{display:flex;align-items:center;gap:10px;padding-top:20px;border-top:1px solid var(--sand-100);margin-top:4px}
  /* TABLE */
  .table-wrap{background:white;border:1px solid var(--sand-200);border-radius:14px;overflow:hidden}
  .tbl{width:100%;border-collapse:collapse}
  .tbl-head th{padding:12px 16px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--sand-400);text-align:left;background:var(--sand-50);border-bottom:1px solid var(--sand-200);white-space:nowrap}
  .tbl-head th.right{text-align:right}.tbl-head th.center{text-align:center}
  .tbl-row{transition:background .15s}.tbl-row:hover{background:var(--sand-50)}
  .tbl-row td{padding:13px 16px;border-bottom:1px solid var(--sand-100);vertical-align:middle;font-size:13.5px}
  .tbl-row:last-child td{border-bottom:none}
  /* FILTER BAR */
  .filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .filter-pills{display:flex;align-items:center;gap:2px;background:white;border:1px solid var(--sand-200);border-radius:9px;padding:3px}
  .pill{padding:5px 13px;border-radius:7px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--sand-500);font-family:var(--font);transition:all .15s}
  .pill.active{background:var(--ink);color:white}
  .pill:not(.active):hover{background:var(--sand-100);color:var(--ink)}
  .search-box{position:relative;flex:1;min-width:180px;max-width:280px}
  .search-box svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--sand-400)}
  .search-input{display:block;width:100%;border:1px solid var(--sand-200);border-radius:8px;padding:8px 30px 8px 34px;font-size:13px;font-family:var(--font);color:var(--ink);background:white;outline:none;transition:border-color .15s,box-shadow .15s}
  .search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-lite)}
  .search-clear{position:absolute;right:9px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--sand-400);font-size:14px;line-height:1;padding:2px;transition:color .15s}
  .search-clear:hover{color:var(--ink)}
  .result-count{font-size:12px;color:var(--sand-400);font-weight:500;margin-left:auto;white-space:nowrap}
  /* BADGES */
  .chip{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;white-space:nowrap}
  .chip-green{background:rgba(22,163,74,.1);color:#15803d}
  .chip-amber{background:rgba(217,119,6,.1);color:#b45309}
  .chip-red{background:rgba(220,38,38,.1);color:var(--red)}
  .chip-gray{background:var(--sand-100);color:var(--sand-600)}
  .size-tag{font-size:11px;font-weight:600;padding:2px 7px;border-radius:5px;border:1px solid var(--sand-200);background:var(--sand-50);color:var(--sand-700);white-space:nowrap}
  .stock-badge{display:inline-flex;align-items:center;justify-content:center;min-width:44px;padding:4px 8px;border-radius:6px;font-size:12.5px;font-weight:700;text-align:center}
  .status-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:5px}
  /* UPLOAD ZONE */
  .upload-zone{border:1px dashed var(--sand-200);border-radius:9px;padding:14px;background:var(--sand-50);transition:border-color .18s}
  .upload-zone:hover{border-color:var(--sand-300)}
  .file-input-label{display:block;cursor:pointer;width:100%;font-size:12px;color:var(--sand-500);font-weight:500}
  /* CHART */
  .chart-card{background:white;border:1px solid var(--sand-200);border-radius:var(--radius);padding:18px 20px}
  .chart-title{font-size:12px;font-weight:700;color:var(--sand-600);margin-bottom:14px;text-transform:uppercase;letter-spacing:.08em}
  /* EMPTY STATE */
  .empty-state{padding:64px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
  .empty-icon{font-size:36px;margin-bottom:4px;opacity:.5}
  .empty-title{font-size:14px;font-weight:600;color:var(--ink)}
  .empty-sub{font-size:13px;color:var(--sand-400)}
  /* TOAST */
  .toast{position:fixed;top:18px;right:22px;z-index:100;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:10px;font-size:13.5px;font-weight:600;color:white;box-shadow:0 8px 30px rgba(0,0,0,.18);animation:toast-in .25s cubic-bezier(.16,1,.3,1)}
  @keyframes toast-in{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}
  .toast.ok{background:#15803d}.toast.err{background:var(--red)}
  .toast-icon{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0}
  /* EXPAND ROW */
  .expand-row td{background:var(--sand-50) !important;border-top:1px solid var(--sand-200)}
  .expand-label{font-size:11px;font-weight:700;color:var(--sand-600);text-transform:uppercase;letter-spacing:.09em;margin-bottom:10px}
  /* ACTIONS CELL */
  .actions-cell{display:flex;align-items:center;justify-content:flex-end;gap:6px;opacity:0;transition:opacity .15s}
  .tbl-row:hover .actions-cell{opacity:1}
  code.sku{font-size:11.5px;color:var(--sand-600);background:var(--sand-100);border:1px solid var(--sand-200);padding:2px 7px;border-radius:5px;font-family:monospace}
  .spinner{animation:spin .7s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  /* ══════════════════════════════════════════════════════
     SPLIT VARIANT EDITOR — new two-panel layout
  ══════════════════════════════════════════════════════ */
  .ve-split-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--sand-200);
    border-radius: 12px;
    overflow: hidden;
  }
  @media(max-width: 860px) {
    .ve-split-wrap { grid-template-columns: 1fr; }
  }

  /* LEFT — Size + Price */
  .ve-left {
    border-right: 1px solid var(--sand-200);
    background: white;
    display: flex;
    flex-direction: column;
  }
  @media(max-width: 860px) { .ve-left { border-right: none; border-bottom: 1px solid var(--sand-200); } }

  .ve-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px;
    background: var(--sand-50);
    border-bottom: 1px solid var(--sand-200);
    flex-wrap: wrap;
  }
  .ve-panel-title { font-size: 12px; font-weight: 700; color: var(--ink); }
  .ve-panel-sub   { font-size: 10.5px; color: var(--sand-400); margin-top: 1px; }

  .size-tbl { width: 100%; border-collapse: collapse; }
  .size-tbl th {
    padding: 8px 12px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em; color: var(--sand-400);
    background: var(--sand-50); border-bottom: 1px solid var(--sand-200);
    text-align: left; white-space: nowrap;
  }
  .size-tbl td { padding: 7px 10px; border-bottom: 1px solid var(--sand-100); vertical-align: middle; }
  .size-tbl tr:last-child td { border-bottom: none; }
  .size-tbl tr:hover td { background: var(--sand-50); }

  /* RIGHT — Color + Image */
  .ve-right {
    background: white;
    display: flex;
    flex-direction: column;
  }

  .color-tbl { width: 100%; border-collapse: collapse; }
  .color-tbl th {
    padding: 8px 12px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em; color: var(--sand-400);
    background: var(--sand-50); border-bottom: 1px solid var(--sand-200);
    text-align: left; white-space: nowrap;
  }
  .color-tbl td { padding: 7px 10px; border-bottom: 1px solid var(--sand-100); vertical-align: middle; }
  .color-tbl tr:last-child td { border-bottom: none; }
  .color-tbl tr:hover td { background: var(--sand-50); }

  /* FOOTER STRIP */
  .ve-footer-strip {
    padding: 10px 14px;
    background: var(--sand-50);
    border-top: 1px solid var(--sand-200);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    grid-column: 1 / -1;
  }
  .ve-footer-text { font-size: 11.5px; color: var(--sand-500); font-weight: 500; }

  /* MATRIX VIEW (expand) */
  .matrix-wrap { overflow-x: auto; }
  .matrix-tbl { border-collapse: collapse; font-size: 12px; }
  .matrix-tbl th { padding: 8px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--sand-400); background: var(--sand-50); border-bottom: 1px solid var(--sand-200); white-space: nowrap; }
  .matrix-tbl td { padding: 9px 14px; border-bottom: 1px solid var(--sand-100); vertical-align: middle; }

  /* color swatch btn in table listing */
  .color-swatch-btn { width:20px;height:20px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:transform .15s,box-shadow .15s;flex-shrink:0 }
  .color-swatch-btn:hover{transform:scale(1.2)}
  .color-swatch-btn.active{box-shadow:0 0 0 2px var(--accent);transform:scale(1.15)}

  /* pbs rows */
  .pbs-row{display:flex;align-items:center;gap:6px}
  .pbs-size{min-width:48px;font-size:10.5px;font-weight:600;color:var(--sand-500)}
  .pbs-price{font-size:12.5px;font-weight:700;color:var(--ink)}
  .pbs-compare{font-size:10px;color:var(--sand-400);text-decoration:line-through;margin-left:3px}
`

/* ─── Toggle ──────────────────────────────────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className="toggle-wrap" onClick={onToggle}>
      <div className={`toggle-track ${on ? 'on' : 'off'}`}><div className="toggle-thumb" /></div>
    </div>
  )
}

function SectionHead({ label, icon }: { label: string; icon?: string }) {
  return (
    <div className="section-head">
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span className="section-head-label">{label}</span>
      <div className="section-head-line" />
    </div>
  )
}

function StatCard({ label, value, icon, iconBg, sub }: { label:string; value:string|number; icon:string; iconBg:string; sub?:string }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
    </div>
  )
}

/* ─── Variant Matrix (read-only expanded view) ────────────────────────────── */
function VariantMatrix({ variants }: { variants: ProductVariant[] }) {
  const sizes  = Array.from(new Set(variants.map(v => v.options?.size_inches).filter(Boolean))) as string[]
  const colors = Array.from(new Set(variants.map(v => v.options?.color).filter(Boolean))) as string[]
  const map: Record<string, Record<string, ProductVariant>> = {}
  variants.forEach(v => {
    const s = v.options?.size_inches ?? ''; const c = v.options?.color ?? ''
    if (!map[s]) map[s] = {}; map[s][c] = v
  })
  if (!sizes.length) return <p style={{ fontSize:12, color:'var(--sand-400)', fontStyle:'italic' }}>No variants configured</p>
  return (
    <div className="matrix-wrap">
      <table className="matrix-tbl">
        <thead>
          <tr>
            <th>Size</th>
            {colors.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {sizes.map(size => (
            <tr key={size}>
              <td style={{ fontWeight:600, color:'var(--ink)', whiteSpace:'nowrap' }}>{size}"</td>
              {colors.map(color => {
                const v = map[size]?.[color]
                return (
                  <td key={color}>
                    {v ? (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:64 }}>
                        {v.image_url && <img src={v.image_url} alt={color} style={{ width:36, height:36, objectFit:'cover', borderRadius:7, border:'1px solid var(--sand-200)' }} />}
                        <span style={{ fontWeight:700, fontSize:12 }}>₹{v.price.toLocaleString('en-IN')}</span>
                        {v.compare_price && v.compare_price > v.price && (
                          <span style={{ fontSize:10, color:'var(--sand-400)', textDecoration:'line-through' }}>₹{v.compare_price.toLocaleString('en-IN')}</span>
                        )}
                        <span className={`chip ${v.inventory_quantity<=0?'chip-red':v.inventory_quantity<=5?'chip-amber':'chip-green'}`} style={{ fontSize:10 }}>
                          {v.inventory_quantity} units
                        </span>
                      </div>
                    ) : <span style={{ color:'var(--sand-200)' }}>—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Split Variant Editor ────────────────────────────────────────────────── */
function SplitVariantEditor({
  sizeRows, colorRows,
  onSizeChange, onColorChange,
}: {
  sizeRows: SizeRow[]
  colorRows: ColorRow[]
  onSizeChange: (r: SizeRow[]) => void
  onColorChange: (r: ColorRow[]) => void
}) {
  const supabase = createClient()

  /* ── Size helpers ── */
  const updateSize = (id: string, patch: Partial<SizeRow>) =>
    onSizeChange(sizeRows.map(r => r.id === id ? { ...r, ...patch } : r))
  const removeSize = (id: string) =>
    onSizeChange(sizeRows.map(r => r.id === id ? { ...r, _delete: true } : r))
  const addSize = (preset = '') =>
    onSizeChange([...sizeRows, { id: uid(), size_inches: preset, sku: '', price: 0, compare_price: 0, inventory_quantity: 0, is_active: true, _isNew: true }])

  /* ── Color helpers ── */
  const updateColor = (id: string, patch: Partial<ColorRow>) =>
    onColorChange(colorRows.map(r => r.id === id ? { ...r, ...patch } : r))
  const removeColor = (id: string) =>
    onColorChange(colorRows.map(r => r.id === id ? { ...r, _delete: true } : r))
  const addColor = (colorName = '') => {
    const preset = COLOR_OPTIONS.find(c => c.name === colorName)
    onColorChange([...colorRows, { id: uid(), color: colorName, image_url: '', color_hex: preset?.hex ?? '', _isNew: true }])
  }

  const uploadColorImage = async (rowId: string, file: File) => {
    const path = `products/variants/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error || !data) return
    const url = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
    updateColor(rowId, { image_url: url })
  }

  const visibleSizes  = sizeRows.filter(r => !r._delete)
  const visibleColors = colorRows.filter(r => !r._delete)
  const totalStock    = visibleSizes.reduce((a, r) => a + r.inventory_quantity, 0)

  const RemoveBtn = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}
      style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--sand-200)', borderRadius:6, background:'white', cursor:'pointer', color:'var(--sand-400)', transition:'all .15s', flexShrink:0 }}
      onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(220,38,38,.3)' }}
      onMouseOut={e  => { (e.currentTarget as HTMLButtonElement).style.color='var(--sand-400)'; (e.currentTarget as HTMLButtonElement).style.borderColor='var(--sand-200)' }}>
      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  )

  return (
    <div style={{ border:'1px solid var(--sand-200)', borderRadius:12, overflow:'hidden' }}>

      {/* ── Two-column split ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>

        {/* ════ LEFT: SIZE + PRICE ════ */}
        <div style={{ borderRight:'1px solid var(--sand-200)', background:'white', display:'flex', flexDirection:'column' }}>
          {/* Header */}
          <div className="ve-panel-head">
            <div>
              <div className="ve-panel-title">📐 Size &amp; Price</div>
              <div className="ve-panel-sub">Price is driven by size</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { addSize(e.target.value); e.target.value = '' } }}
                style={{ border:'1px solid var(--sand-200)', borderRadius:7, padding:'5px 8px', fontSize:11.5, fontFamily:'var(--font)', color:'var(--ink)', background:'white', cursor:'pointer', outline:'none' }}
              >
                <option value="">+ Preset</option>
                {INCH_PRESETS.map(s => <option key={s} value={s}>{s}"</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSize()}>+ Custom</button>
            </div>
          </div>

          {/* Size table */}
          {visibleSizes.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:6, opacity:.4 }}>📐</div>
              <div style={{ fontSize:12, color:'var(--sand-400)' }}>No sizes yet — add a preset above</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto', flex:1 }}>
              <table className="size-tbl">
                <thead>
                  <tr>
                    <th>Size (in)</th>
                    <th>SKU</th>
                    <th>Price ₹</th>
                    <th>Was ₹</th>
                    <th>Stock</th>
                    <th>On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSizes.map(row => (
                    <tr key={row.id}>
                      {/* Size */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <input type="text" value={row.size_inches} placeholder="12x16" className="inp-sm"
                            onChange={e => updateSize(row.id, { size_inches: e.target.value })}
                            style={{ width:58 }} />
                          <span style={{ fontSize:10, color:'var(--sand-400)', fontWeight:600 }}>"</span>
                        </div>
                      </td>
                      {/* SKU */}
                      <td>
                        <input type="text" value={row.sku} placeholder="SKU" className="inp-sm"
                          onChange={e => updateSize(row.id, { sku: e.target.value })}
                          style={{ width:64, fontFamily:'monospace' }} />
                      </td>
                      {/* Price */}
                      <td>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--sand-400)', fontWeight:700 }}>₹</span>
                          <input type="number" min={0} value={row.price} className="inp-sm"
                            onChange={e => updateSize(row.id, { price: parseFloat(e.target.value)||0 })}
                            style={{ width:72, paddingLeft:16 }} />
                        </div>
                      </td>
                      {/* Compare */}
                      <td>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--sand-400)', fontWeight:700 }}>₹</span>
                          <input type="number" min={0} value={row.compare_price} className="inp-sm"
                            onChange={e => updateSize(row.id, { compare_price: parseFloat(e.target.value)||0 })}
                            style={{ width:72, paddingLeft:16 }} />
                        </div>
                      </td>
                      {/* Stock */}
                      <td>
                        <input type="number" min={0} value={row.inventory_quantity} className="inp-sm"
                          onChange={e => updateSize(row.id, { inventory_quantity: parseInt(e.target.value)||0 })}
                          style={{ width:50, textAlign:'center', fontWeight:700 }} />
                      </td>
                      {/* Active */}
                      <td><Toggle on={row.is_active} onToggle={() => updateSize(row.id, { is_active: !row.is_active })} /></td>
                      {/* Remove */}
                      <td><RemoveBtn onClick={() => removeSize(row.id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ════ RIGHT: COLOR + IMAGE ════ */}
        <div style={{ background:'white', display:'flex', flexDirection:'column' }}>
          {/* Header */}
          <div className="ve-panel-head">
            <div>
              <div className="ve-panel-title">🎨 Color &amp; Image</div>
              <div className="ve-panel-sub">Color drives the gallery photo</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { addColor(e.target.value); e.target.value = '' } }}
                style={{ border:'1px solid var(--sand-200)', borderRadius:7, padding:'5px 8px', fontSize:11.5, fontFamily:'var(--font)', color:'var(--ink)', background:'white', cursor:'pointer', outline:'none' }}
              >
                <option value="">+ Preset</option>
                {COLOR_OPTIONS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addColor()}>+ Custom</button>
            </div>
          </div>

          {/* Color table */}
          {visibleColors.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:6, opacity:.4 }}>🎨</div>
              <div style={{ fontSize:12, color:'var(--sand-400)' }}>No colors yet — add a preset above</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto', flex:1 }}>
              <table className="color-tbl">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Hex</th>
                    <th>Image</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleColors.map(row => (
                    <tr key={row.id}>
                      {/* Color name + swatch */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ width:14, height:14, borderRadius:'50%', flexShrink:0, background: row.color_hex || COLOR_HEX[row.color?.toLowerCase()] || '#ccc', border:'2px solid white', boxShadow:'0 0 0 1px rgba(0,0,0,.1)' }} />
                          <select value={row.color} className="inp-sm"
                            onChange={e => {
                              const preset = COLOR_OPTIONS.find(c => c.name === e.target.value)
                              updateColor(row.id, { color: e.target.value, color_hex: preset?.hex ?? row.color_hex })
                            }}
                            style={{ width:90 }}>
                            <option value="">Select…</option>
                            {COLOR_OPTIONS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </td>
                      {/* Hex */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <input type="color" value={row.color_hex || '#cccccc'}
                            onChange={e => updateColor(row.id, { color_hex: e.target.value })}
                            style={{ width:28, height:28, border:'1px solid var(--sand-200)', borderRadius:6, cursor:'pointer', padding:2, background:'white' }} />
                          <input type="text" value={row.color_hex} placeholder="#hex" className="inp-sm"
                            onChange={e => updateColor(row.id, { color_hex: e.target.value })}
                            style={{ width:66, fontFamily:'monospace', fontSize:10.5 }} />
                        </div>
                      </td>
                      {/* Image */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {row.image_url ? (
                            <div style={{ position:'relative', flexShrink:0 }}>
                              <img src={row.image_url} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:8, border:'1px solid var(--sand-200)' }} />
                              <button type="button" onClick={() => updateColor(row.id, { image_url:'' })}
                                style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', background:'var(--red)', color:'white', border:'1.5px solid white', fontSize:8, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                            </div>
                          ) : (
                            <label style={{ width:40, height:40, border:'1.5px dashed var(--sand-200)', borderRadius:8, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                              <input type="file" accept="image/*" style={{ display:'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadColorImage(row.id, f) }} />
                              <span style={{ fontSize:14 }}>🖼</span>
                            </label>
                          )}
                          <input type="url" placeholder="or paste URL" value={row.image_url} className="inp-sm"
                            onChange={e => updateColor(row.id, { image_url: e.target.value })}
                            style={{ width:100, fontSize:10.5 }} />
                        </div>
                      </td>
                      {/* Remove */}
                      <td><RemoveBtn onClick={() => removeColor(row.id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer strip (full width) ── */}
      {(visibleSizes.length > 0 || visibleColors.length > 0) && (
        <div style={{ padding:'9px 14px', background:'var(--sand-50)', borderTop:'1px solid var(--sand-200)', display:'flex', flexWrap:'wrap', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11.5, color:'var(--sand-500)', fontWeight:500 }}>
            {visibleSizes.length} size{visibleSizes.length!==1?'s':''} · {visibleColors.length} color{visibleColors.length!==1?'s':''} · {totalStock} units total
          </span>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginLeft:4 }}>
            {visibleSizes.filter(r => r.price > 0).map(r => (
              <span key={r.id} className="size-tag">{r.size_inches}" · ₹{r.price.toLocaleString('en-IN')}</span>
            ))}
          </div>
          <div style={{ display:'flex', gap:5, marginLeft:8, flexWrap:'wrap' }}>
            {visibleColors.filter(r => r.color).map(r => (
              <span key={r.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:'var(--sand-600)', background:'white', border:'1px solid var(--sand-200)', borderRadius:5, padding:'2px 7px' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background: r.color_hex || '#ccc', flexShrink:0 }} />
                {r.color}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Helpers to convert flat variants ↔ split rows ──────────────────────── */
function variantsToSplitRows(variants: ProductVariant[]): { sizeRows: SizeRow[]; colorRows: ColorRow[] } {
  const seenSizes = new Map<string, SizeRow>()
  const seenColors = new Map<string, ColorRow>()

  variants.forEach(v => {
    const size  = v.options?.size_inches ?? ''
    const color = v.options?.color ?? ''
    if (size && !seenSizes.has(size)) {
      seenSizes.set(size, {
        id: v.id + '-size', size_inches: size, sku: v.sku ?? '',
        price: v.price, compare_price: v.compare_price ?? 0,
        inventory_quantity: v.inventory_quantity, is_active: v.is_active, _isNew: false,
      })
    }
    if (color && !seenColors.has(color)) {
      seenColors.set(color, {
        id: v.id + '-color', color, image_url: v.image_url ?? '',
        color_hex: v.color_hex ?? COLOR_HEX[color.toLowerCase()] ?? '', _isNew: false,
      })
    }
  })
  return { sizeRows: Array.from(seenSizes.values()), colorRows: Array.from(seenColors.values()) }
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminProductsPage() {
  const supabase = createClient()
  const mainImageRef = useRef<HTMLInputElement>(null)

  const [products,     setProducts]    = useState<Product[]>([])
  const [categories,   setCategories]  = useState<Category[]>([])
  const [loading,      setLoading]     = useState(true)
  const [showForm,     setShowForm]    = useState(false)
  const [editing,      setEditing]     = useState<Product|null>(null)
  const [formData,     setFormData]    = useState({...EMPTY_FORM})
  const [sizeRows,     setSizeRows]    = useState<SizeRow[]>([])
  const [colorRows,    setColorRows]   = useState<ColorRow[]>([])
  const [saving,       setSaving]      = useState(false)
  const [expandedId,   setExpandedId]  = useState<string|null>(null)
  const [search,       setSearch]      = useState('')
  const [toast,        setToast]       = useState<{msg:string;ok:boolean}|null>(null)
  const [statusFilter, setStatusFilter]= useState<'all'|'active'|'draft'|'low'>('all')
  const [showStats,    setShowStats]   = useState(true)
  const [rowColorPick, setRowColorPick]= useState<Record<string,string>>({})

  const showToast = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500) }
  const fd = (k: string, v: any) => setFormData(p => ({...p,[k]:v}))

  const fetchAll = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name,slug), variants:product_variants(*)').order('created_at',{ascending:false}),
      supabase.from('categories').select('*').eq('is_active',true).order('position'),
    ])
    setProducts(prods||[]); setCategories(cats||[]); setLoading(false)
  }, [supabase])
  useEffect(() => { fetchAll() }, [fetchAll])

  /* Stats */
  const stats = {
    total:    products.length,
    active:   products.filter(p => p.is_active).length,
    featured: products.filter(p => p.is_featured).length,
    lowStock: products.filter(p => {
      const s = (p.variants?.filter(v=>v.is_active)??[]).reduce((a,b)=>a+b.inventory_quantity,p.inventory_quantity)
      return s>0&&s<=10
    }).length,
    oos: products.filter(p => {
      const s = (p.variants?.filter(v=>v.is_active)??[]).reduce((a,b)=>a+b.inventory_quantity,p.inventory_quantity)
      return s===0
    }).length,
  }
  const chartData = products
    .map(p => {
      const stock = (p.variants?.filter(v=>v.is_active)??[]).reduce((a,b)=>a+b.inventory_quantity,p.inventory_quantity)
      return { name: p.name.length>14?p.name.slice(0,13)+'...':p.name, stock }
    })
    .sort((a,b)=>b.stock-a.stock).slice(0,8)

  /* Save: cross-join size × color into flat variants */
  const saveVariants = async (productId: string) => {
    // Delete existing
    await supabase.from('product_variants').delete().eq('product_id', productId)

    const activeSizes  = sizeRows.filter(r => !r._delete)
    const activeColors = colorRows.filter(r => !r._delete)

    if (!activeSizes.length && !activeColors.length) return

    const upsert: any[] = []

    if (activeSizes.length && activeColors.length) {
      // Cross-join: one variant per size × color
      activeSizes.forEach(sz => {
        activeColors.forEach(cl => {
          upsert.push({
            product_id: productId,
            name: [`${sz.size_inches}"`, cl.color].filter(Boolean).join(' · '),
            sku: sz.sku || null,
            price: sz.price,
            compare_price: sz.compare_price || null,
            inventory_quantity: Math.round(sz.inventory_quantity / Math.max(activeColors.length, 1)),
            options: {
              ...(sz.size_inches ? { size_inches: sz.size_inches } : {}),
              ...(cl.color      ? { color: cl.color }              : {}),
            },
            is_active: sz.is_active,
            image_url: cl.image_url || null,
            color_hex: cl.color_hex || null,
          })
        })
      })
    } else if (activeSizes.length) {
      // Only sizes
      activeSizes.forEach(sz => {
        upsert.push({
          product_id: productId,
          name: sz.size_inches ? `${sz.size_inches}"` : null,
          sku: sz.sku || null,
          price: sz.price,
          compare_price: sz.compare_price || null,
          inventory_quantity: sz.inventory_quantity,
          options: sz.size_inches ? { size_inches: sz.size_inches } : {},
          is_active: sz.is_active,
          image_url: null,
          color_hex: null,
        })
      })
    } else {
      // Only colors
      activeColors.forEach(cl => {
        upsert.push({
          product_id: productId,
          name: cl.color || null,
          sku: null,
          price: 0,
          compare_price: null,
          inventory_quantity: 0,
          options: cl.color ? { color: cl.color } : {},
          is_active: true,
          image_url: cl.image_url || null,
          color_hex: cl.color_hex || null,
        })
      })
    }

    if (upsert.length) await supabase.from('product_variants').insert(upsert)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const payload = {
      ...formData,
      price: parseFloat(String(formData.price))||0,
      compare_price: formData.compare_price ? parseFloat(String(formData.compare_price)) : null,
      inventory_quantity: parseInt(String(formData.inventory_quantity))||0,
      category_id: formData.category_id || null,
    }
    let productId = editing?.id ?? ''
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { showToast(error.message, false); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('products').insert([payload]).select('id').single()
      if (error || !data) { showToast(error?.message||'Insert failed', false); setSaving(false); return }
      productId = data.id
    }
    if (productId) await saveVariants(productId)
    await fetchAll()
    showToast(editing ? 'Product updated' : 'Product created')
    setSaving(false); setShowForm(false); resetForm()
  }

  const handleEdit = (p: Product) => {
    setEditing(p)
    setFormData({
      name:p.name, slug:p.slug, description:p.description||'',
      short_description:p.short_description||'', sku:p.sku||'',
      price:p.price, compare_price:p.compare_price||0,
      category_id:p.category_id||'', main_image_url:p.main_image_url||'',
      images:p.images?.length?p.images:['','','',''],
      inventory_quantity:p.inventory_quantity, track_inventory:p.track_inventory,
      is_active:p.is_active, is_featured:p.is_featured,
      option_keys:p.option_keys||['size_inches','color'],
    })
    const { sizeRows: sr, colorRows: cr } = variantsToSplitRows(p.variants ?? [])
    setSizeRows(sr); setColorRows(cr)
    setShowForm(true); window.scrollTo({top:0,behavior:'smooth'})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and all its variants?')) return
    await supabase.from('product_variants').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast(error.message, false); return }
    await fetchAll(); showToast('Product deleted')
  }

  const uploadImage = async (file: File, folder = 'products') => {
    const path = `${folder}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error || !data) return ''
    return supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
  }

  const resetForm = () => { setFormData({...EMPTY_FORM}); setSizeRows([]); setColorRows([]); setEditing(null) }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku?.toLowerCase()||'').includes(search.toLowerCase())
    const stock = (p.variants?.filter(v=>v.is_active)??[]).reduce((a,b)=>a+b.inventory_quantity,p.inventory_quantity)
    const matchFilter = statusFilter==='all'?true:statusFilter==='active'?p.is_active:statusFilter==='draft'?!p.is_active:stock<=10
    return matchSearch && matchFilter
  })

  const swatchHex = (color: string, variants: ProductVariant[]) => {
    const v = variants.find(vv => vv.options?.color?.toLowerCase()===color.toLowerCase())
    return (v as any)?.color_hex || COLOR_HEX[color.toLowerCase()] || '#ccc'
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:280, gap:14, fontFamily:'var(--font)' }}>
      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sand-300)" strokeWidth="2.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span style={{ fontSize:13.5, color:'var(--sand-400)', fontWeight:500 }}>Loading products...</span>
    </div>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="products-root">
        {toast && (
          <div className={`toast ${toast.ok?'ok':'err'}`}>
            <div className="toast-icon">{toast.ok?'✓':'✕'}</div>
            {toast.msg}
          </div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">Manage your catalog, variants &amp; inventory</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button className="btn btn-ghost" style={{ fontSize:12.5 }} onClick={() => setShowStats(s=>!s)}>
              {showStats?'Hide':'Show'} Stats
            </button>
            {!showForm && (
              <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
                New Product
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="stat-grid" style={{ marginBottom:16 }}>
            <StatCard label="Total"        value={stats.total}    icon="📦" iconBg="var(--sand-100)"        sub="products"/>
            <StatCard label="Active"       value={stats.active}   icon="✅" iconBg="rgba(22,163,74,.1)"     sub="published"/>
            <StatCard label="Featured"     value={stats.featured} icon="⭐" iconBg="rgba(217,119,6,.1)"     sub="promoted"/>
            <StatCard label="Low Stock"    value={stats.lowStock} icon="⚠️" iconBg="rgba(217,119,6,.08)"    sub="≤10 units"/>
            <StatCard label="Out of Stock" value={stats.oos}      icon="🚫" iconBg="rgba(220,38,38,.08)"    sub="0 units"/>
          </div>
        )}
        {showStats && chartData.length > 0 && (
          <div className="chart-card" style={{ marginBottom:16 }}>
            <div className="chart-title">Stock by product</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barSize={24} margin={{ top:0, right:0, left:-24, bottom:0 }}>
                <XAxis dataKey="name" tick={{ fontSize:10, fontWeight:600, fill:'var(--sand-400)', fontFamily:'var(--font)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--sand-400)' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius:8, border:'1px solid var(--sand-200)', fontSize:12, fontWeight:600, fontFamily:'var(--font)', boxShadow:'0 4px 16px rgba(0,0,0,.1)' }} cursor={{ fill:'rgba(0,0,0,.03)' }}/>
                <Bar dataKey="stock" radius={[6,6,0,0]}>
                  {chartData.map((_,i) => <Cell key={i} fill={i<3?'var(--ink)':'var(--sand-300)'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="form-panel" style={{ marginBottom:20 }}>
            <div className="form-header">
              <div>
                <div className="form-title">{editing?'Edit Product':'New Product'}</div>
                <div className="form-subtitle">{editing?editing.name:'Fill in the details to create a new product'}</div>
              </div>
              <button onClick={() => { setShowForm(false); resetForm() }} className="btn btn-ghost btn-sm">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form-body">
              {/* Basic Info */}
              <div className="form-section">
                <SectionHead label="Basic Information" icon="📝"/>
                <div className="form-grid-4">
                  <div className="col-span-2">
                    <label className="form-label">Product Name <span className="req">*</span></label>
                    <input required type="text" value={formData.name} className="inp" placeholder="e.g. Ayatul Kursi Acrylic Wall Art"
                      onChange={e => {
                        const name = e.target.value
                        fd('name',name)
                        fd('slug',name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))
                      }}/>
                  </div>
                  <div>
                    <label className="form-label">Slug <span className="req">*</span></label>
                    <input required type="text" value={formData.slug} onChange={e=>fd('slug',e.target.value)} className="inp" style={{ fontFamily:'monospace', fontSize:12.5 }}/>
                  </div>
                  <div>
                    <label className="form-label">SKU</label>
                    <input type="text" value={formData.sku} onChange={e=>fd('sku',e.target.value)} className="inp" placeholder="AK-001" style={{ fontFamily:'monospace' }}/>
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select value={formData.category_id} onChange={e=>fd('category_id',e.target.value)} className="inp" style={{ cursor:'pointer' }}>
                      <option value="">No category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Base Price <span style={{ color:'var(--sand-400)', fontWeight:400 }}>(fallback)</span></label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--sand-400)', fontWeight:600, pointerEvents:'none' }}>₹</span>
                      <input type="number" min={0} step="0.01" value={formData.price} onChange={e=>fd('price',parseFloat(e.target.value)||0)} className="inp" style={{ paddingLeft:24 }}/>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Compare Price</label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--sand-400)', fontWeight:600, pointerEvents:'none' }}>₹</span>
                      <input type="number" min={0} step="0.01" value={formData.compare_price} onChange={e=>fd('compare_price',parseFloat(e.target.value)||0)} className="inp" style={{ paddingLeft:24 }}/>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <label className="form-label">Short Description</label>
                    <input type="text" value={formData.short_description} onChange={e=>fd('short_description',e.target.value)} className="inp" placeholder="One-line summary shown in product listings"/>
                  </div>
                </div>
                <div className="form-toggles">
                  {([{k:'track_inventory',l:'Track Inventory'},{k:'is_active',l:'Active'},{k:'is_featured',l:'Featured'}] as const).map(({k,l}) => (
                    <div key={k} className="toggle-wrap" onClick={()=>fd(k,!(formData as any)[k])}>
                      <div className={`toggle-track ${(formData as any)[k]?'on':'off'}`}><div className="toggle-thumb"/></div>
                      <span className="toggle-label">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="form-section">
                <SectionHead label="Description" icon="📄"/>
                <textarea rows={4} value={formData.description} onChange={e=>fd('description',e.target.value)} className="inp" style={{ resize:'vertical' }} placeholder="Full product description..."/>
              </div>

              {/* Images */}
              <div className="form-section">
                <SectionHead label="Images" icon="🖼"/>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label className="form-label">Main Image</label>
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div className="upload-zone" style={{ flex:1 }}>
                        <label className="file-input-label">
                          <input ref={mainImageRef} type="file" accept="image/*" style={{ display:'none' }}
                            onChange={async e => { const f=e.target.files?.[0]; if(!f) return; const url=await uploadImage(f); if(url) fd('main_image_url',url) }}/>
                          <span style={{ color:'var(--accent)', fontWeight:600, cursor:'pointer' }}>Choose file</span>
                          <span style={{ marginLeft:6, fontSize:11, color:'var(--sand-400)' }}>(or paste URL below)</span>
                        </label>
                        <input type="url" placeholder="https://..." value={formData.main_image_url}
                          onChange={e=>fd('main_image_url',e.target.value)} className="inp" style={{ marginTop:8, fontSize:12.5 }}/>
                      </div>
                      {formData.main_image_url && (
                        <div style={{ position:'relative', flexShrink:0 }}>
                          <img src={formData.main_image_url} alt="" style={{ width:80, height:80, objectFit:'cover', borderRadius:10, border:'1px solid var(--sand-200)' }}/>
                          <button type="button" onClick={()=>fd('main_image_url','')} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'var(--red)', color:'white', border:'2px solid white', fontSize:9, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Gallery (up to 4)</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                      {formData.images.map((url,i) => (
                        <div key={i} className="upload-zone" style={{ padding:10 }}>
                          <label className="file-input-label" style={{ fontSize:11 }}>
                            <input type="file" accept="image/*" style={{ display:'none' }}
                              onChange={async e => {
                                const f=e.target.files?.[0]; if(!f) return
                                const pu = await uploadImage(f,'products/gallery')
                                if(pu) { const imgs=[...formData.images]; imgs[i]=pu; fd('images',imgs) }
                              }}/>
                            <span style={{ color:'var(--accent)', fontWeight:600 }}>Choose</span>
                          </label>
                          <input type="url" placeholder={`Image ${i+1}`} value={url}
                            onChange={e=>{ const imgs=[...formData.images]; imgs[i]=e.target.value; fd('images',imgs) }}
                            className="inp" style={{ marginTop:6, fontSize:11, padding:'5px 8px' }}/>
                          {url && <img src={url} alt="" style={{ height:60, width:'100%', objectFit:'cover', borderRadius:7, marginTop:6 }}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Split Variant Editor */}
              <div className="form-section">
                <SectionHead label="Variants — Size (left) · Color + Image (right)" icon="📐"/>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', background:'rgba(59,130,246,.06)', border:'1px solid rgba(59,130,246,.15)', borderRadius:8, marginBottom:14 }}>
                  <span style={{ fontSize:14, lineHeight:1.5 }}>💡</span>
                  <span style={{ fontSize:12, color:'#1d4ed8', lineHeight:1.5 }}>
                    <strong>Left panel</strong>: add sizes with their price &amp; stock. <strong>Right panel</strong>: add colors with their image. Variants are auto-created as Size × Color combinations.
                  </span>
                </div>
                <SplitVariantEditor
                  sizeRows={sizeRows}
                  colorRows={colorRows}
                  onSizeChange={setSizeRows}
                  onColorChange={setColorRows}
                />
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7"/>
                      </svg>
                      {editing?'Update Product':'Create Product'}
                    </>
                  )}
                </button>
                <button type="button" className="btn btn-ghost" onClick={()=>{ setShowForm(false); resetForm() }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar */}
        <div className="filter-bar" style={{ marginBottom:14 }}>
          <div className="filter-pills">
            {([{k:'all',l:'All'},{k:'active',l:'Active'},{k:'draft',l:'Draft'},{k:'low',l:'Low Stock'}] as const).map(({k,l}) => (
              <button key={k} className={`pill ${statusFilter===k?'active':''}`} onClick={()=>setStatusFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="search-box">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="search" placeholder="Search products, SKU..." value={search} onChange={e=>setSearch(e.target.value)} className="search-input"/>
            {search && <button className="search-clear" onClick={()=>setSearch('')}>✕</button>}
          </div>
          <span className="result-count">{filtered.length} of {products.length} products</span>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <div style={{ overflowX:'auto' }}>
            <table className="tbl">
              <thead className="tbl-head">
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th>
                  <th>Price by Size</th><th>Sizes &amp; Colors</th>
                  <th className="center">Stock</th><th className="center">Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-icon">📦</div>
                      <div className="empty-title">{search?`No results for "${search}"`:'No products yet'}</div>
                      <div className="empty-sub">{search?'Try a different keyword':'Get started by adding your first product'}</div>
                      {!search && (
                        <button className="btn btn-primary" style={{ marginTop:8, fontSize:12.5 }} onClick={()=>{ resetForm(); setShowForm(true) }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                          </svg>
                          Add Product
                        </button>
                      )}
                    </div>
                  </td></tr>
                ) : filtered.map(product => {
                  const variants   = (product.variants??[]).filter(v=>v.is_active)
                  const sizes      = Array.from(new Set(variants.map(v=>v.options?.size_inches).filter(Boolean))) as string[]
                  const colors     = Array.from(new Set(variants.map(v=>v.options?.color).filter(Boolean))) as string[]
                  const totalStock = variants.reduce((a,v)=>a+v.inventory_quantity,product.inventory_quantity)
                  const isExpanded = expandedId===product.id
                  const sizePriceMap = sizes.map(size => {
                    const sv    = variants.filter(v=>v.options?.size_inches===size)
                    const prices= sv.map(v=>v.price)
                    const min   = Math.min(...prices)
                    const max   = Math.max(...prices)
                    const cp    = sv[0]?.compare_price??null
                    return {size,min,max,cp}
                  })
                  const pickedColor  = rowColorPick[product.id]??''
                  const previewImg   = pickedColor
                    ? variants.find(v=>v.options?.color?.toLowerCase()===pickedColor.toLowerCase()&&v.image_url)?.image_url??null
                    : null

                  return (
                    <Fragment key={product.id}>
                      <tr className="tbl-row">
                        {/* Product */}
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:48, height:48, borderRadius:9, overflow:'hidden', background:'var(--sand-100)', flexShrink:0, border:'1px solid var(--sand-200)', position:'relative' }}>
                              {(previewImg||product.main_image_url)
                                ? <img key={previewImg||product.main_image_url} src={previewImg||product.main_image_url} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity .25s' }}/>
                                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📦</div>
                              }
                              {pickedColor && (
                                <div style={{ position:'absolute', bottom:2, right:2, width:10, height:10, borderRadius:'50%', background:swatchHex(pickedColor,variants), border:'1.5px solid white', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }}/>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13.5, color:'var(--ink)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
                              {product.short_description && (
                                <div style={{ fontSize:11.5, color:'var(--sand-400)', marginTop:2, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.short_description}</div>
                              )}
                              {variants.length>0 && (
                                <button onClick={()=>setExpandedId(isExpanded?null:product.id)}
                                  style={{ marginTop:3, fontSize:11, color:'var(--accent)', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:3, fontFamily:'var(--font)' }}>
                                  <svg style={{ transform:isExpanded?'rotate(180deg)':'none', transition:'transform .2s' }} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                                  </svg>
                                  {variants.length} variant{variants.length!==1?'s':''}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* SKU */}
                        <td><code className="sku">{product.sku||'—'}</code></td>
                        {/* Category */}
                        <td style={{ fontSize:13, color:'var(--sand-600)', fontWeight:500 }}>
                          {product.categories?.name||<span style={{ color:'var(--sand-200)' }}>—</span>}
                        </td>
                        {/* Price by size */}
                        <td>
                          {sizePriceMap.length>0 ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                              {sizePriceMap.map(({size,min,max,cp}) => (
                                <div key={size} className="pbs-row">
                                  <span className="pbs-size">{size}"</span>
                                  <span className="pbs-price">₹{min.toLocaleString('en-IN')}{max!==min&&<span style={{ fontSize:10, color:'var(--sand-400)' }}>–{max.toLocaleString('en-IN')}</span>}</span>
                                  {cp&&cp>min&&<span className="pbs-compare">₹{cp.toLocaleString('en-IN')}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontWeight:700, fontSize:14 }}>₹{product.price.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        {/* Sizes & Colors */}
                        <td>
                          {sizes.length>0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:colors.length?7:0 }}>
                              {sizes.slice(0,3).map(s=><span key={s} className="size-tag">{s}"</span>)}
                              {sizes.length>3&&<span style={{ fontSize:11, color:'var(--sand-400)', fontWeight:600, alignSelf:'center' }}>+{sizes.length-3}</span>}
                            </div>
                          )}
                          {colors.length>0 && (
                            <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                              {colors.map(color => {
                                const hex = swatchHex(color,variants)
                                const isSel = pickedColor.toLowerCase()===color.toLowerCase()
                                return (
                                  <button key={color} type="button" title={color}
                                    className={`color-swatch-btn${isSel?' active':''}`}
                                    style={{ background:hex }}
                                    onClick={()=>setRowColorPick(prev=>({...prev,[product.id]:isSel?'':color}))}
                                  />
                                )
                              })}
                              {pickedColor&&<span style={{ fontSize:10.5, color:'var(--sand-500)', fontWeight:600 }}>{pickedColor}</span>}
                            </div>
                          )}
                          {!sizes.length&&!colors.length&&<span style={{ color:'var(--sand-200)' }}>—</span>}
                        </td>
                        {/* Stock */}
                        <td style={{ textAlign:'center' }}>
                          <span className={`stock-badge ${totalStock<=0?'chip-red':totalStock<=10?'chip-amber':'chip-green'}`}>{totalStock}</span>
                        </td>
                        {/* Status */}
                        <td style={{ textAlign:'center' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                            <span className={`chip ${product.is_active?'chip-green':'chip-gray'}`}>
                              <span className="status-dot" style={{ background:product.is_active?'var(--green)':'var(--sand-400)' }}/>
                              {product.is_active?'Active':'Draft'}
                            </span>
                            {product.is_featured&&<span className="chip chip-amber">★ Featured</span>}
                          </div>
                        </td>
                        {/* Actions */}
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-ghost btn-sm" onClick={()=>handleEdit(product)}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(product.id)}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="expand-row">
                            <div className="expand-label">Variant Matrix — Size × Color</div>
                            <VariantMatrix variants={product.variants??[]}/>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}