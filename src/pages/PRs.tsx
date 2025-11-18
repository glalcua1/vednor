import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useAppState } from '../state/AppStateContext'
import { PRItem, PurchaseRequisition } from '../state/types'
import Acronym from '../components/Acronym'
import Drawer from '../components/Drawer'
import DepartmentSelect from '../components/DepartmentSelect'
import RFQs from './RFQs'
import POs from './POs'
import Invoices from './Invoices'
import { IconTrash } from '../components/icons'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'

function PRs() {
  const { state, addPR, updatePR, addRFQ, addPO, deletePR } = useAppState() as any
  const isEmployee = state.currentUser.role === 'Requestor'
  const isReviewer = state.currentUser.role === 'Procurement' || state.currentUser.role === 'Finance'
  const [dept, setDept] = useState('Engineering')
  const [budget, setBudget] = useState(() => {
    const code = state?.settings?.departments?.find((d: any) => d.name === 'Engineering')?.budgetCode
    return code ?? 'ENG-2025-TOOLS'
  })
  function budgetForDepartment(name?: string): string | undefined {
    if (!name) return undefined
    const code = state?.settings?.departments?.find((d: any) => d.name === name)?.budgetCode
    return code || undefined
  }
  const [currency, setCurrency] = useState('USD')
  const [justification, setJustification] = useState('')
  const [items, setItems] = useState<PRItem[]>([])
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState<'Software' | 'Office Supplies' | 'Services' | 'Other'>('Software')
  const [newQty, setNewQty] = useState<number>(1)
  const [newUnit, setNewUnit] = useState<number>(0)
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tab, setTab] = useState<'PR' | 'RFQ' | 'PO' | 'INV'>('PR')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<'id' | 'date' | 'dept' | 'budget' | 'currency' | 'total' | 'status'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string, department: string, budgetCode: string, currency: string, justification: string, items: PRItem[] } | null>(null)
  const [menuForId, setMenuForId] = useState<string | null>(null)
  const [hoverPRId, setHoverPRId] = useState<string | null>(null)
  const [ack, setAck] = useState<{ id: string, kind: 'RFQ' | 'PO', ts: number } | null>(null)
  // Marketplace state
  const [marketOpen, setMarketOpen] = useState(false)
  const [marketSearch, setMarketSearch] = useState('')
  const [marketCategory, setMarketCategory] = useState<'All' | 'Hardware' | 'Software' | 'Services' | 'Other'>('All')
  const [marketBag, setMarketBag] = useState<Array<{ id: string, title: string, category: PRItem['category'], unitCost: number, quantity: number }>>([])
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const marketplaceCatalog = [
    {
      id: 'imac-24',
      title: 'Apple iMac 24" (M4) 8‑core',
      vendor: 'Apple',
      category: 'Hardware' as const,
      unitCost: 1299,
      imageUrl: 'https://www.apple.com/v/imac/o/images/overview/hero__f5phw1ivc0i2_large_2x.jpg'
    },
    {
      id: 'imac-24-16gb',
      title: 'Apple iMac 24" (M4) 10‑core • 16GB',
      vendor: 'Apple',
      category: 'Hardware' as const,
      unitCost: 1699,
      imageUrl: 'https://www.apple.com/v/imac/o/images/overview/performance_hero__c36w9m0y1t8i_large_2x.jpg'
    },
    {
      id: 'applecare-mac',
      title: 'AppleCare+ for Mac (3 years)',
      vendor: 'Apple',
      category: 'Services' as const,
      unitCost: 199,
      imageUrl: 'https://www.apple.com/v/applecare-plus/o/images/overview/hero_applecare__e9a8h3u7w26y_large_2x.jpg'
    },
    {
      id: 'display-27',
      title: '27" 4K External Display (Vendor Approved)',
      vendor: 'Apple',
      category: 'Hardware' as const,
      unitCost: 599,
      imageUrl: 'https://www.apple.com/v/imac/o/images/overview/display__f0l8m5rv9e2e_large_2x.jpg'
    }
  ]
  const formatShortDate = (iso?: string) => {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const day = d.getDate().toString().padStart(2, '0')
    const mon = d.toLocaleString(undefined, { month: 'short' })
    const yr = (d.getFullYear() % 100).toString().padStart(2, '0')
    return `${day}/${mon}/${yr}`
  }
  const visiblePRs = state.prs
    .filter((p: PurchaseRequisition) => {
      // Employees only see their own PRs
      if (isEmployee) return p.requestedByUserId === state.currentUser.id
      return true
    })
    .filter((p: PurchaseRequisition) => {
      if (!query) return true
      const hay = [
        `PR-${p.id.slice(0,6)}`,
        formatShortDate(p.createdAt),
        p.department,
        p.budgetCode,
        p.currency ?? 'USD',
        p.status,
        String(p.expectedTotal)
      ].join(' ').toLowerCase()
      return hay.includes(query.toLowerCase())
    })
    .sort((a: PurchaseRequisition, b: PurchaseRequisition) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'id': return (a.id.localeCompare(b.id)) * dir
        case 'date': return ((new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) * dir
        case 'dept': return (a.department ?? '').localeCompare(b.department ?? '') * dir
        case 'budget': return (a.budgetCode ?? '').localeCompare(b.budgetCode ?? '') * dir
        case 'currency': return (a.currency ?? 'USD').localeCompare(b.currency ?? 'USD') * dir
        case 'total': return (a.expectedTotal - b.expectedTotal) * dir
        case 'status': return (a.status ?? '').localeCompare(b.status ?? '') * dir
        default: return 0
      }
    })
  const prStatusCounts = (() => {
    const m = new Map<string, number>()
    visiblePRs.forEach(p => m.set(p.status, (m.get(p.status) ?? 0) + 1))
    return m
  })()
  function computePRStatus(pr: PurchaseRequisition): string {
    const po = state.pos.find(po => po.fromPRId === pr.id)
    if (po?.deliveryConfirmed) return 'Delivered'
    if (po) return 'Converted to PO'
    const rfq = state.rfqs.find(r => r.fromPRId === pr.id)
    if (rfq?.status === 'Awarded') return 'RFQ Awarded'
    if (rfq) return 'Converted to RFQ'
    return pr.status
  }
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = (params.get('tab') || '').toUpperCase()
    if (isEmployee) {
      setTab('PR')
    } else {
      if (t === 'PR' || t === 'RFQ' || t === 'PO' || t === 'INV') {
        setTab(t as any)
      }
    }
    const vendorId = params.get('vendorId')
    if (vendorId) {
      const v = state.vendors.find(v => v.id === vendorId)
      if (v) {
        setTab('PO')
        setQuery(v.name)
      }
    }
  }, [location.search])

  function selectTab(next: 'PR' | 'RFQ' | 'PO' | 'INV') {
    if (isEmployee && next !== 'PR') return
    setTab(next)
    const params = new URLSearchParams(location.search)
    params.set('tab', next)
    // Clear vendorId deep-link param when switching tabs to avoid forced PO tab / blank states
    if (params.has('vendorId')) params.delete('vendorId')
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
  }

  function addItem() {
    if (!newDesc || newQty <= 0) return
    setItems([...items, { id: uuid(), description: newDesc, category: newCat, quantity: newQty, unitCost: newUnit }])
    setNewDesc(''); setNewCat('Software'); setNewQty(1); setNewUnit(0)
    showToast('Item added to the requisition.', 'success')
  }
  function updateItem(id: string, patch: Partial<PRItem>) {
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i))
  }
  function removeItem(id: string) {
    setItems(items.filter(i => i.id !== id))
    showToast('Item removed from the requisition.', 'info')
  }
  function createPR() {
    const expectedTotal = items.reduce((s, i) => s + (i.quantity * i.unitCost), 0)
    if (!items.length) return alert('Add at least one item.')
    addPR({
      requestedByUserId: state.currentUser.id,
      department: dept,
      justification,
      budgetCode: budget,
      currency,
      expectedTotal,
      items
    })
    setDept('Engineering'); setBudget(budgetForDepartment('Engineering') ?? 'ENG-2025-TOOLS'); setCurrency('USD'); setJustification(''); setItems([]); setSuccess(true)
  }

  function convertToRFQ(prId: string) {
    setAck({ id: prId, kind: 'RFQ', ts: Date.now() })
    addRFQ({ fromPRId: prId, invitedVendorIds: state.vendors.map(v => v.id) })
    const pr = state.prs.find(p => p.id === prId)
    if (pr) updatePR({ ...pr, status: 'Converted to RFQ' })
  }

  function convertToPO(prId: string) {
    const pr = state.prs.find(p => p.id === prId)
    if (!pr) return
    if (!state.vendors.length) return alert('Add a vendor first.')
    setAck({ id: prId, kind: 'PO', ts: Date.now() })
    addPO({
      fromPRId: prId,
      vendorId: state.vendors[0].id,
      items: pr.items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unitCost: i.unitCost })),
      total: pr.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)
    })
    updatePR({ ...pr, status: 'Converted to PO' })
  }
  // Marketplace helpers
  function filteredMarket() {
    return marketplaceCatalog.filter(it => {
      const bySearch = !marketSearch || it.title.toLowerCase().includes(marketSearch.toLowerCase())
      const byCat = marketCategory === 'All' || it.category === marketCategory
      return bySearch && byCat
    })
  }
  function addToBag(prodId: string) {
    const prod = marketplaceCatalog.find(p => p.id === prodId)
    if (!prod) return
    setMarketBag(prev => {
      const existing = prev.find(p => p.id === prodId)
      if (existing) {
        return prev.map(p => p.id === prodId ? { ...p, quantity: p.quantity + 1 } : p)
      }
      return [...prev, { id: prod.id, title: prod.title, category: prod.category, unitCost: prod.unitCost, quantity: 1 }]
    })
  }
  function updateBagQty(prodId: string, qty: number) {
    setMarketBag(prev => prev.map(p => p.id === prodId ? { ...p, quantity: Math.max(1, qty) } : p))
  }
  function removeFromBag(prodId: string) {
    setMarketBag(prev => prev.filter(p => p.id !== prodId))
  }
  function commitBagToPR() {
    if (!marketBag.length) return
    const toAdd: PRItem[] = marketBag.map(b => ({
      id: uuid(),
      description: b.title,
      category: b.category,
      quantity: b.quantity,
      unitCost: b.unitCost
    }))
    setItems(prev => [...prev, ...toAdd])
    setMarketBag([])
    setMarketOpen(false)
    showToast('Marketplace items added to PR.', 'success')
  }

  return (
    <div className="grid cols-1">
      <div className="tabs">
        <button className={`tab ${tab === 'PR' ? 'active' : ''}`} onClick={() => selectTab('PR')}>Purchase Requisitions</button>
        {!isEmployee && (
          <>
            <button className={`tab ${tab === 'RFQ' ? 'active' : ''}`} onClick={() => selectTab('RFQ')}>Requests for Quotation</button>
            <button className={`tab ${tab === 'PO' ? 'active' : ''}`} onClick={() => selectTab('PO')}>Purchase Orders</button>
            <button className={`tab ${tab === 'INV' ? 'active' : ''}`} onClick={() => selectTab('INV')}>Invoices</button>
          </>
        )}
      </div>

      {tab === 'PR' && (
        <>
          <div className="section-title">
            <div className="row" style={{ flexWrap: 'nowrap' as any, width: '100%' }}>
              <div className="spacer" />
              <input
                className="input"
                style={{ height: 36, maxWidth: 360 }}
                placeholder="Search PRs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn primary" onClick={() => { setOpen(true); setSuccess(false) }}>Add Purchase Requisition</button>
            </div>
          </div>
          <div className="table-block">
            <div className="table-header">
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <div>Purchase Requisitions</div>
                <span className="badge blue">{visiblePRs.length}</span>
              </div>
              <div className="row">
                {([...prStatusCounts.entries()] as Array<[string, number]>).map(([s, c]) => (
                  <span key={s} className={`badge ${/Rejected/.test(s) ? 'red' : /Pending/.test(s) ? 'orange' : /Approved|Converted/.test(s) ? 'green' : 'blue'}`}>{s}: {c}</span>
                ))}
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => { setSortKey('id'); setSortDir(sortKey === 'id' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>PR {sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setSortKey('date'); setSortDir(sortKey === 'date' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Date {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setSortKey('dept'); setSortDir(sortKey === 'dept' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Dept {sortKey === 'dept' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setSortKey('budget'); setSortDir(sortKey === 'budget' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Budget {sortKey === 'budget' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setSortKey('currency'); setSortDir(sortKey === 'currency' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Currency {sortKey === 'currency' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setSortKey('total'); setSortDir(sortKey === 'total' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Total {sortKey === 'total' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => { setSortKey('status'); setSortDir(sortKey === 'status' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  {isEmployee && <th>Expected Delivery</th>}
                  {!isEmployee && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visiblePRs.map(p => (
                  <tr key={p.id} className={(() => {
                    const ms = Date.now() - new Date(p.createdAt).getTime()
                    return ms < 5000 ? 'row-flash' : ''
                  })()}>
                    <td
                      onMouseEnter={() => setHoverPRId(p.id)}
                      onMouseLeave={() => setHoverPRId(prev => (prev === p.id ? null : prev))}
                      style={{ position: 'relative' }}
                    >
                      PR-{p.id.slice(0,6)}
                      {hoverPRId === p.id && (
                        <div className="elevated" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#fff', padding: 12, borderRadius: 10, zIndex: 10, minWidth: 280, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>PR Details</div>
                          <div style={{ fontSize: 13, marginBottom: 4 }}>Requested by: {state.users.find(u => u.id === p.requestedByUserId)?.name ?? p.requestedByUserId}</div>
                          <div style={{ fontSize: 13, marginBottom: 8 }}>Department: {p.department ?? '-'}</div>
                          <div style={{ fontSize: 13, marginBottom: 6 }}>Items:</div>
                          <div style={{ maxHeight: 140, overflow: 'auto' }}>
                            {(p.items ?? []).map(i => (
                              <div key={i.id} style={{ fontSize: 13, display: 'flex', gap: 8, marginBottom: 4 }}>
                                <div style={{ flex: 1, opacity: .9 }}>{i.description}</div>
                                <div style={{ whiteSpace: 'nowrap' }}>{i.quantity} × {(p.currency ?? 'USD')} {i.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                            ))}
                            {(p.items ?? []).length === 0 && <div style={{ fontSize: 13, opacity: .7 }}>No items</div>}
                          </div>
                          <div style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                            Total: {(p.currency ?? 'USD')} {(p.expectedTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{formatShortDate(p.createdAt)}</td>
                    <td>{p.department}</td>
                    <td>{p.budgetCode}</td>
                    <td>{p.currency ?? 'USD'}</td>
                    <td>{(p.currency ?? 'USD')} {p.expectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      {(() => {
                        const status = computePRStatus(p)
                        const color = /Rejected/.test(status) ? 'red' : /Delivered|Approved|Converted/.test(status) ? 'green' : 'orange'
                        return <span className={`badge ${color}`}>{status}</span>
                      })()}
                    </td>
                    {isEmployee ? (
                      <td>
                        {(() => {
                          const po = state.pos.find(po => po.fromPRId === p.id)
                          return formatShortDate(po?.expectedDeliveryDate)
                        })()}
                      </td>
                    ) : (
                      <td className="actions" style={{ position: 'relative' }}>
                        {p.status === 'Pending Dept Approval' && (
                          <>
                            <button className="btn primary small" onClick={() => updatePR({ ...p, status: 'Pending Procurement Approval' })}>Approve (Dept)</button>
                            <button className="btn ghost small" onClick={() => updatePR({ ...p, status: 'Rejected' })}>Reject</button>
                          </>
                        )}
                        {p.status === 'Pending Procurement Approval' && (
                          <>
                            <button className="btn primary small" onClick={() => updatePR({ ...p, status: 'Approved' })}>Approve (Procurement)</button>
                            <button className="btn ghost small" onClick={() => updatePR({ ...p, status: 'Rejected' })}>Reject</button>
                          </>
                        )}
                        {(p.status === 'Approved' || /Converted/.test(p.status)) && (
                          <>
                            <button className="btn ghost small" onClick={() => convertToRFQ(p.id)}>
                              PR → RFQ{ack && ack.id === p.id && ack.kind === 'RFQ' && Date.now() - ack.ts < 2000 ? ' ✓' : ''}
                            </button>
                            <button className="btn ghost small" onClick={() => convertToPO(p.id)}>
                              PR → PO{ack && ack.id === p.id && ack.kind === 'PO' && Date.now() - ack.ts < 2000 ? ' ✓' : ''}
                            </button>
                          </>
                        )}
                        <button className="btn ghost small" aria-label="More actions" onClick={() => setMenuForId(menuForId === p.id ? null : p.id)}>⋯</button>
                        {menuForId === p.id && (
                          <div className="elevated" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: '#fff', padding: 8, borderRadius: 10, zIndex: 5, minWidth: 160 }}>
                            <div className="row" style={{ width: '100%' }}>
                              <button className="btn small" style={{ width: '100%' }} onClick={() => {
                                setEditing({
                                  id: p.id,
                                  department: p.department,
                                  budgetCode: p.budgetCode,
                                  currency: p.currency ?? 'USD',
                                  justification: p.justification,
                                  items: p.items
                                })
                                setEditOpen(true)
                                setMenuForId(null)
                              }}>Edit</button>
                            </div>
                          <div className="row" style={{ width: '100%', marginTop: 6 }}>
                            <button className="btn danger small" style={{ width: '100%' }} onClick={() => { deletePR(p.id); setMenuForId(null); showToast('Purchase Requisition deleted.', 'info') }}>Delete</button>
                            </div>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {state.prs.length === 0 && <tr><td colSpan={6}>No PRs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isEmployee && tab === 'RFQ' && <RFQs query={query} setQuery={setQuery} />}
      {!isEmployee && tab === 'PO' && <POs query={query} />}
      {!isEmployee && tab === 'INV' && <Invoices query={query} />}

      <Drawer
        open={open}
        onClose={() => { setOpen(false); setSuccess(false) }}
        title="Create PR"
        width={860}
        footer={!success && (
          <>
            <button className="btn ghost" onClick={() => { setOpen(false); setSuccess(false) }}>Cancel</button>
            <button className="btn primary" onClick={createPR}>Submit PR</button>
          </>
        )}
      >
        {success ? (
          <div className="victory">
            <div className="check">✓</div>
            <h2>Purchase Requisition submitted</h2>
            <p>Your PR has been sent for approval. You can monitor its status from the PR list. Conversion to RFQ/PO can be done after approval.</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => { setOpen(false); setSuccess(false) }}>Close</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid cols-3">
              <div className="field">
                <label>Department</label>
                <DepartmentSelect
                  value={dept}
                  onChange={(v) => {
                    setDept(v)
                    const mapped = budgetForDepartment(v)
                    if (mapped) setBudget(mapped)
                  }}
                />
              </div>
              <div className="field">
                <label>Budget Code</label>
                <input className="input" value={budget} onChange={e => setBudget(e.target.value)} disabled={isEmployee} />
              </div>
              <div className="field">
                <label>Currency</label>
                <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>INR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>SGD</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 3' as any }}>
                <label>Justification</label>
                <textarea className="textarea" value={justification} onChange={e => setJustification(e.target.value)} />
              </div>
            </div>
            <div className="card elevated" style={{ marginTop: 8 }}>
              <h3>Add Item</h3>
              <div className="grid cols-4">
                <div className="field">
                  <label>Description</label>
                  <input className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select className="select" value={newCat} onChange={e => setNewCat(e.target.value as any)}>
                    <option>Software</option>
                    <option>Hardware</option>
                    <option>Office Supplies</option>
                    <option>Services</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label>Qty</label>
                  <input type="number" className="input" value={newQty} onChange={e => setNewQty(parseInt(e.target.value || '0'))} />
                </div>
                <div className="field">
                  <label>Unit Cost</label>
                  <input type="number" className="input" value={newUnit} onChange={e => setNewUnit(parseFloat(e.target.value || '0'))} />
                </div>
              </div>
              <div className="row">
                <div className="spacer" />
                <button className="btn ghost" onClick={addItem}>Add Item</button>
                {isEmployee && <button className="btn primary" onClick={() => setMarketOpen(true)}>Select from Marketplace</button>}
              </div>
            </div>
            <div className="card" style={{ marginTop: 12 }}>
              <div className="table-block">
                <div className="table-header">PR Items</div>
                <table className="table">
                <thead><tr><th>Description</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td><input className="input" value={i.description} onChange={e => updateItem(i.id, { description: e.target.value })} /></td>
                      <td>
                        <select className="select" value={i.category} onChange={e => updateItem(i.id, { category: e.target.value as any })}>
                          <option>Software</option>
                          <option>Hardware</option>
                          <option>Office Supplies</option>
                          <option>Services</option>
                          <option>Other</option>
                        </select>
                      </td>
                      <td><input type="number" className="input" value={i.quantity} onChange={e => updateItem(i.id, { quantity: parseInt(e.target.value || '0') })} /></td>
                      <td><input type="number" className="input" value={i.unitCost} onChange={e => updateItem(i.id, { unitCost: parseFloat(e.target.value || '0') })} /></td>
                      <td>{currency} {(i.quantity * i.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td><button className="btn ghost small" onClick={() => removeItem(i.id)}>Remove</button></td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={6}>No items added.</td></tr>}
                </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Drawer>
      <Drawer
        open={marketOpen}
        onClose={() => setMarketOpen(false)}
        title="Marketplace"
        width={1024}
        footer={
          <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--text-700)' }}>
              Bag: {marketBag.reduce((s, b) => s + b.quantity, 0)} item(s) • Total {currency} {marketBag.reduce((s, b) => s + b.quantity * b.unitCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div>
              <button className="btn ghost" onClick={() => setMarketOpen(false)}>Close</button>
              <button className="btn primary" disabled={!marketBag.length} onClick={commitBagToPR}>Add to PR</button>
            </div>
          </div>
        }
      >
        <div className="grid cols-1">
          <div className="row" style={{ gap: 8 }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Search marketplace..." value={marketSearch} onChange={e => setMarketSearch(e.target.value)} />
            <select className="select inline" value={marketCategory} onChange={e => setMarketCategory(e.target.value as any)}>
              <option>All</option>
              <option>Hardware</option>
              <option>Software</option>
              <option>Services</option>
              <option>Other</option>
            </select>
            <div className="spacer" />
            <div className="badge blue">Curated • Apple</div>
          </div>
          <div className="grid cols-3">
            {filteredMarket().map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 12, overflow: 'hidden', background: '#f6f9fe', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    const fallbackSrc = '/Vivid-Lavender.png'
                    const chosenSrc = isEmployee ? '/imac-blue-selection-hero-202410.jpeg' : (p.imageUrl || '')
                    const showFallback = brokenImages[p.id] || !chosenSrc
                    if (showFallback) {
                      return <img src={fallbackSrc} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .9 }} />
                    }
                    return (
                      <img
                        src={chosenSrc}
                        alt={p.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={() => setBrokenImages(prev => ({ ...prev, [p.id]: true }))}
                      />
                    )
                  })()}
                </div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-700)' }}>{p.vendor} • {p.category}</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{currency} {p.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn primary small" onClick={() => addToBag(p.id)}>Add to Bag</button>
                </div>
              </div>
            ))}
            {filteredMarket().length === 0 && (
              <div className="card" style={{ gridColumn: 'span 3' as any }}>
                No matching items.
              </div>
            )}
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <div className="table-block">
              <div className="table-header">Your Bag</div>
              <table className="table">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {marketBag.map(b => (
                    <tr key={b.id}>
                      <td>{b.title}</td>
                      <td>
                        <input type="number" className="input" value={b.quantity} onChange={e => updateBagQty(b.id, parseInt(e.target.value || '1'))} />
                      </td>
                      <td>{currency} {b.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{currency} {(b.quantity * b.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="actions"><button className="btn ghost small" onClick={() => removeFromBag(b.id)}>Remove</button></td>
                    </tr>
                  ))}
                  {marketBag.length === 0 && <tr><td colSpan={5}>Bag is empty.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Drawer>
      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Purchase Requisition"
        width={960}
        footer={
          <>
            <button className="btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
            <button
              className="btn primary"
              onClick={() => {
                if (!editing) return
                const pr = state.prs.find(pr => pr.id === editing.id)
                if (!pr) { setEditOpen(false); return }
                const expectedTotal = (editing.items ?? []).reduce((s, i) => s + (i.quantity * i.unitCost), 0)
                updatePR({
                  ...pr,
                  department: editing.department,
                  budgetCode: editing.budgetCode,
                  currency: editing.currency,
                  justification: editing.justification,
                  items: editing.items ?? pr.items,
                  expectedTotal
                })
                setEditOpen(false)
              }}
            >
              Save Changes
            </button>
          </>
        }
      >
        {editing && (
          <>
            <div className="grid cols-2">
              <div className="field">
                <label>Department</label>
                <DepartmentSelect
                  value={editing.department}
                  onChange={(v) => setEditing(prev => {
                    if (!prev) return prev
                    const mapped = budgetForDepartment(v)
                    return { ...prev, department: v, budgetCode: mapped ?? prev.budgetCode }
                  })}
                />
              </div>
              <div className="field">
                <label>Budget Code</label>
                <input className="input" value={editing.budgetCode} onChange={(e) => setEditing(prev => prev ? { ...prev, budgetCode: e.target.value } : prev)} />
              </div>
              <div className="field">
                <label>Currency</label>
                <select className="select" value={editing.currency} onChange={(e) => setEditing(prev => prev ? { ...prev, currency: e.target.value } : prev)}>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>INR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>SGD</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' as any }}>
                <label>Justification</label>
                <textarea className="textarea" value={editing.justification} onChange={(e) => setEditing(prev => prev ? { ...prev, justification: e.target.value } : prev)} />
              </div>
            </div>
            <div className="card" style={{ marginTop: 12 }}>
              <div className="table-block">
                <div className="table-header">Items</div>
                <table className="table">
                  <thead><tr><th>Description</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {(editing.items ?? []).map(i => (
                      <tr key={i.id}>
                        <td><input className="input" value={i.description} onChange={(e) => setEditing(prev => prev ? { ...prev, items: prev.items.map(it => it.id === i.id ? { ...it, description: e.target.value } : it) } : prev)} /></td>
                        <td>
                          <select className="select" value={i.category} onChange={(e) => setEditing(prev => prev ? { ...prev, items: prev.items.map(it => it.id === i.id ? { ...it, category: e.target.value as any } : it) } : prev)}>
                            <option>Software</option>
                            <option>Office Supplies</option>
                            <option>Services</option>
                            <option>Other</option>
                          </select>
                        </td>
                        <td><input type="number" className="input" value={i.quantity} onChange={(e) => setEditing(prev => prev ? { ...prev, items: prev.items.map(it => it.id === i.id ? { ...it, quantity: parseInt(e.target.value || '0') } : it) } : prev)} /></td>
                        <td><input type="number" className="input" value={i.unitCost} onChange={(e) => setEditing(prev => prev ? { ...prev, items: prev.items.map(it => it.id === i.id ? { ...it, unitCost: parseFloat(e.target.value || '0') } : it) } : prev)} /></td>
                        <td>{editing.currency} {(i.quantity * i.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="actions"><button className="btn ghost small" onClick={() => setEditing(prev => prev ? { ...prev, items: prev.items.filter(it => it.id !== i.id) } : prev)}>Remove</button></td>
                      </tr>
                    ))}
                    {(editing.items ?? []).length === 0 && (
                      <tr><td colSpan={6}>No items.</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="row" style={{ padding: 12 }}>
                  <div className="spacer" />
                  <button className="btn ghost small" onClick={() => setEditing(prev => prev ? { ...prev, items: [...prev.items, { id: uuid(), description: '', category: 'Software', quantity: 1, unitCost: 0 }] } : prev)}>Add Item</button>
                </div>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default PRs


