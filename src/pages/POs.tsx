import { useAppState } from '../state/AppStateContext'
import Acronym from '../components/Acronym'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { IconTrash, IconChat } from '../components/icons'
import Drawer from '../components/Drawer'
import { PurchaseOrder, Vendor, RFQ, Quote, PurchaseRequisition } from '../state/types'
import { showToast } from '../utils/toast'

function POs({ query = '' }: { query?: string }) {
  const { state, updatePO, addAsset, deletePO, updateVendor, updatePR, addInvoice } = useAppState()
  const formatShortDate = (iso?: string) => {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const day = d.getDate().toString().padStart(2, '0')
    const mon = d.toLocaleString(undefined, { month: 'short' })
    const yr = (d.getFullYear() % 100).toString().padStart(2, '0')
    return `${day}/${mon}/${yr}`
  }
  function addBusinessDays(fromISO: string, days: number): string {
    let date = new Date(fromISO)
    let added = 0
    while (added < days) {
      date.setDate(date.getDate() + 1)
      const day = date.getDay()
      if (day !== 0 && day !== 6) {
        added++
      }
    }
    return date.toISOString().slice(0,10)
  }
  const navigate = useNavigate()
  const location = useLocation()
  const [vendorFilterId, setVendorFilterId] = useState<string>('All')
  const [localQuery, setLocalQuery] = useState<string>('')
  const effectiveQuery = (localQuery || query).toLowerCase()
  // Initialize vendor filter from URL (in effect to avoid setting state during render)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get('vendorId')
    if (v) {
      setVendorFilterId(v)
    } else {
      setVendorFilterId('All')
    }
  }, [location.search])
  const [terms, setTerms] = useState('Net 30')
  const [expected, setExpected] = useState('')
  const [sortKey, setSortKey] = useState<'id' | 'vendor' | 'total' | 'status' | 'expected' | 'accepted' | 'grn' | 'date'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [negotiateOpen, setNegotiateOpen] = useState(false)
  const [negotiatePO, setNegotiatePO] = useState<PurchaseOrder | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Array<{ from: 'me' | 'vendor', text: string, ts: string }>>([])
  const [hoverPR, setHoverPR] = useState<string | null>(null)
  const aiPrompts = [
    'Could you consider a 5% reduction for upfront payment within 7 days?',
    'If we extend the term to 24 months, can you improve the unit rate?',
    'We noticed competitor quotes are lower—can you match or better them?',
    'We can commit to higher volumes. What discount can you offer for that?',
  ]
  function openNegotiation(po: PurchaseOrder) {
    setNegotiatePO(po)
    setNegotiateOpen(true)
    const vendor = state.vendors.find(v => v.id === po.vendorId)
    const intro = `Hello ${vendor?.contactPerson ?? 'Team'}, thanks for the proposal. We’d like to discuss rate optimization.`
    setMessages([{ from: 'vendor', text: intro, ts: new Date().toISOString() }])
  }
  const [rateForPOId, setRateForPOId] = useState<string | null>(null)
  const [tempRating, setTempRating] = useState<number>(0)
  function commitRating(po: PurchaseOrder, rating: number) {
    const vendor = state.vendors.find(v => v.id === po.vendorId)
    if (vendor) {
      updateVendor({ ...vendor, rating })
    }
    updatePO({ ...po, status: 'Closed' })
    setRateForPOId(null)
    setTempRating(0)
  }
  function sendMsg(text: string) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { from: 'me', text, ts: new Date().toISOString() }])
    setChatInput('')
  }

  return (
    <div className="grid cols-1">
      <div className="table-block">
        {(() => {
          const visiblePOs = state.pos
            .filter((p: PurchaseOrder) => {
              if (!query) return true
              const vendor = state.vendors.find(v => v.id === p.vendorId)
              const hay = [`PO-${p.id.slice(0,6)}`, vendor?.name ?? '', p.status, String(p.total), p.expectedDeliveryDate ?? ''].join(' ').toLowerCase()
              return hay.includes(query.toLowerCase())
            })
          const poStatusCounts = (() => {
            const m = new Map<string, number>()
            visiblePOs.forEach((p: PurchaseOrder) => m.set(p.status, (m.get(p.status) ?? 0) + 1))
            return m
          })()
          return (
            <div className="table-header">
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <div><Acronym text="POs" /></div>
                <span className="badge blue">{visiblePOs.length}</span>
              </div>
              <div className="row">
                {([...poStatusCounts.entries()] as Array<[string, number]>).map(([s, c]) => (
                  <span key={s} className={`badge ${s === 'Closed' ? 'green' : s === 'Open' ? 'orange' : 'blue'}`}>{s}: {c}</span>
                ))}
              </div>
            </div>
          )
        })()}
        <div className="row" style={{ padding: '8px 12px' }}>
          <select className="select inline" value={vendorFilterId} onChange={e => setVendorFilterId(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="All">All Vendors</option>
            {state.vendors.map((v: Vendor) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <div className="spacer" />
          <input className="input" style={{ height: 36, maxWidth: 320 }} placeholder="Search POs..." value={localQuery} onChange={e => setLocalQuery(e.target.value)} />
        </div>
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => { setSortKey('id'); setSortDir(sortKey === 'id' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>PO {sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('vendor'); setSortDir(sortKey === 'vendor' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Vendor {sortKey === 'vendor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>From PR</th>
              <th>Discount</th>
              <th onClick={() => { setSortKey('total'); setSortDir(sortKey === 'total' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Total {sortKey === 'total' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('status'); setSortDir(sortKey === 'status' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('expected'); setSortDir(sortKey === 'expected' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Expected {sortKey === 'expected' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('accepted'); setSortDir(sortKey === 'accepted' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Accepted {sortKey === 'accepted' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('grn'); setSortDir(sortKey === 'grn' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}><Acronym text="GRN" /> {sortKey === 'grn' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.pos
              .filter((p: PurchaseOrder) => {
                const vendorOk = vendorFilterId === 'All' ? true : p.vendorId === vendorFilterId
                if (!vendorOk) return false
                if (!effectiveQuery) return true
                const vendor = state.vendors.find((v: Vendor) => v.id === p.vendorId)
                const hay = [`PO-${p.id.slice(0,6)}`, vendor?.name ?? '', p.status, String(p.total), p.expectedDeliveryDate ?? ''].join(' ').toLowerCase()
                return hay.includes(effectiveQuery)
              })
              .sort((a: PurchaseOrder, b: PurchaseOrder) => {
                const dir = sortDir === 'asc' ? 1 : -1
                const vendorA = state.vendors.find((v: Vendor) => v.id === a.vendorId)?.name ?? ''
                const vendorB = state.vendors.find((v: Vendor) => v.id === b.vendorId)?.name ?? ''
                switch (sortKey) {
                  case 'date': return ((new Date(a.createdAt).getTime()) - (new Date(b.createdAt).getTime())) * dir
                  case 'id': return a.id.localeCompare(b.id) * dir
                  case 'vendor': return vendorA.localeCompare(vendorB) * dir
                  case 'total': return (a.total - b.total) * dir
                  case 'status': return a.status.localeCompare(b.status) * dir
                  case 'expected': return (a.expectedDeliveryDate ?? '').localeCompare(b.expectedDeliveryDate ?? '') * dir
                  case 'accepted': return ((a.vendorAccepted ? 1 : 0) - (b.vendorAccepted ? 1 : 0)) * dir
                  case 'grn': return ((a.deliveryConfirmed ? 1 : 0) - (b.deliveryConfirmed ? 1 : 0)) * dir
                  default: return 0
                }
              })
              .map((p: PurchaseOrder) => {
              const vendor = state.vendors.find((v: Vendor) => v.id === p.vendorId)
              const expected = (() => {
                if (p.expectedDeliveryDate) return p.expectedDeliveryDate
                if (p.fromRFQId) {
                  const rfq = state.rfqs.find((r: RFQ) => r.id === p.fromRFQId)
                  const q = rfq ? rfq.quotes.find((q: Quote) => q.id === rfq.selectedQuoteId) : undefined
                  if (rfq && q) return addBusinessDays(rfq.createdAt, q.deliveryDays)
                }
                return '-'
              })()
              return (
                <tr key={p.id} className={(() => {
                  const ms = Date.now() - new Date(p.createdAt).getTime()
                  return ms < 5000 ? 'row-flash' : ''
                })()}>
                  <td>PO-{p.id.slice(0,6)}</td>
                  <td>{vendor?.name ?? '-'}</td>
                  <td
                    onMouseEnter={() => setHoverPR(p.fromPRId ?? null)}
                    onMouseLeave={() => setHoverPR(prev => (prev === (p.fromPRId ?? null) ? null : prev))}
                    style={{ position: 'relative' }}
                  >
                    {p.fromPRId ? `PR-${p.fromPRId.slice(0,6)}` : '-'}
                    {p.fromPRId && hoverPR === p.fromPRId && (() => {
                      const pr = state.prs.find((pr: PurchaseRequisition) => pr.id === p.fromPRId)
                      const currency = pr?.currency ?? 'USD'
                      const requester = pr ? state.users.find(u => u.id === pr.requestedByUserId)?.name ?? pr.requestedByUserId : '-'
                      return (
                        <div className="elevated" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#fff', padding: 12, borderRadius: 10, zIndex: 10, minWidth: 280, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>PR Details</div>
                          <div style={{ fontSize: 13, marginBottom: 4 }}>Requested by: {requester}</div>
                          <div style={{ fontSize: 13, marginBottom: 8 }}>Department: {pr?.department ?? '-'}</div>
                          <div style={{ fontSize: 13, marginBottom: 6 }}>Items:</div>
                          <div style={{ maxHeight: 140, overflow: 'auto' }}>
                            {(pr?.items ?? []).map((i) => (
                              <div key={i.id} style={{ fontSize: 13, display: 'flex', gap: 8, marginBottom: 4 }}>
                                <div style={{ flex: 1, opacity: .9 }}>{i.description}</div>
                                <div style={{ whiteSpace: 'nowrap' }}>{i.quantity} × {currency} {i.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                            ))}
                            {(pr?.items ?? []).length === 0 && <div style={{ fontSize: 13, opacity: .7 }}>No items</div>}
                          </div>
                          <div style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                            Total: {currency} {(pr?.expectedTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td>{typeof vendor?.discount === 'number' ? `${vendor.discount}%` : '-'}</td>
                  <td>
                    {(() => {
                      const currency = (state.prs.find((pr: PurchaseRequisition) => pr.id === p.fromPRId)?.currency ?? 'USD')
                      return `${currency} ${p.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    })()}
                  </td>
                  <td><span className={`badge ${p.status === 'Closed' ? 'green' : p.status === 'Delivered' ? 'blue' : 'orange'}`}>{p.status}</span></td>
                  <td>{expected === '-' ? '-' : formatShortDate(expected)}</td>
                  <td>{p.vendorAccepted ? <span className="badge green">Yes</span> : <span className="badge orange">No</span>}</td>
                  <td>{p.deliveryConfirmed ? <span className="badge green">GRN Received</span> : <span className="badge orange">Pending</span>}</td>
                  <td className="actions" style={{ position: 'relative' }}>
                    <button className="btn ghost small" title="Negotiate rate" onClick={() => openNegotiation(p)}><IconChat /></button>
                    {!p.vendorAccepted && <button className="btn small" onClick={() => updatePO({ ...p, vendorAccepted: true, terms: terms || 'Net 30', expectedDeliveryDate: expected || p.expectedDeliveryDate })}>Vendor Accept</button>}
                    {!p.deliveryConfirmed && <button className="btn primary small" onClick={() => {
                      updatePO({ ...p, deliveryConfirmed: true, status: 'Delivered' })
                      const pr = state.prs.find((pr: PurchaseRequisition) => pr.id === p.fromPRId)
                      if (pr) {
                        // Keep PR reflecting the latest lifecycle; using Approved as a terminal internal status
                        updatePR({ ...pr, status: 'Approved' })
                      }
                      // Auto-generate invoice on delivery with 30 business days due
                      addInvoice({
                        vendorId: p.vendorId,
                        poId: p.id,
                        amount: p.total,
                        dueDate: addBusinessDays(new Date().toISOString(), 30)
                      })
                    }}>Confirm Delivery (GRN)</button>}
                    {p.deliveryConfirmed && <button className="btn ghost small" onClick={() => {
                      const name = p.items[0]?.description ?? `PO-${p.id.slice(0,6)} Item`
                      const pr = p.fromPRId ? state.prs.find((pr: PurchaseRequisition) => pr.id === p.fromPRId) : undefined
                      const dept = pr?.department ?? undefined
                      const asset = addAsset({
                        vendorId: p.vendorId,
                        name,
                        department: dept,
                        renewalDate: new Date(Date.now() + 1000*60*60*24*365).toISOString().slice(0,10),
                        autoRenew: false
                      })
                      navigate('/renewals', { state: { highlightAssetId: asset.id } })
                    }}>Add Asset</button>}
                    {p.status !== 'Closed' && (
                      <button className="btn ghost small" onClick={() => { setRateForPOId(rateForPOId === p.id ? null : p.id); setTempRating(0) }}>Close PO</button>
                    )}
                    {rateForPOId === p.id && (
                      <div className="elevated" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, padding: 12, background: '#fff', borderRadius: 10, width: 260, zIndex: 5 }}>
                        {(() => {
                          const vendor = state.vendors.find(v => v.id === p.vendorId)
                          return (
                            <>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>Rate Vendor</div>
                              <div style={{ fontSize: 12, color: 'var(--text-700)', marginBottom: 8 }}>
                                {vendor?.name ?? '-'} • POC: {vendor?.contactPerson ?? '-'}
                              </div>
                            </>
                          )
                        })()}
                        <div className="row" style={{ marginBottom: 10 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} className="btn small" style={{ width: 32, height: 32, padding: 0 }} onClick={() => setTempRating(n)}>
                              {n <= tempRating ? '★' : '☆'}
                            </button>
                          ))}
                        </div>
                        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                          <button className="btn ghost small" onClick={() => { setRateForPOId(null); setTempRating(0) }}>Cancel</button>
                          <button className="btn primary small" disabled={!tempRating} onClick={() => commitRating(p, tempRating)}>Save & Close PO</button>
                        </div>
                      </div>
                    )}
                    <button className="btn danger small" aria-label="Delete PO" onClick={() => { deletePO(p.id); showToast('Purchase Order deleted.', 'info') }}><IconTrash /></button>
                  </td>
                </tr>
              )
            })}
            {state.pos.length === 0 && <tr><td colSpan={6}>No POs yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Drawer
        open={negotiateOpen}
        onClose={() => setNegotiateOpen(false)}
        title="Negotiate Rate"
        width={720}
        footer={
          <div className="row" style={{ width: '100%' }}>
            {aiPrompts.map((p, idx) => (
              <button key={idx} className="btn small ghost" onClick={() => sendMsg(p)}>{p}</button>
            ))}
          </div>
        }
      >
        {negotiatePO && (
          <>
            <div className="elevated" style={{ padding: 12, marginBottom: 12 }}>
              {(() => {
                const vendor = state.vendors.find(v => v.id === negotiatePO.vendorId)
                return (
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{vendor?.name ?? '-'}</div>
                      <div style={{ color: 'var(--text-700)', fontSize: 12 }}>Point of contact: {vendor?.contactPerson ?? '-'}</div>
                    </div>
                    <div style={{ color: 'var(--text-700)', fontSize: 12 }}>PO-{negotiatePO.id.slice(0,6)}</div>
                  </div>
                )
              })()}
            </div>
            <div className="elevated" style={{ height: 320, overflow: 'auto', padding: 12, marginBottom: 12, background: '#fff' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div style={{ maxWidth: '70%', padding: '8px 10px', borderRadius: 10, background: m.from === 'me' ? 'var(--brand-50)' : '#f1f5fb', color: 'var(--text-900)', border: '1px solid var(--border)', fontSize: 14 }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Write a professional message..." />
              <button className="btn primary" onClick={() => sendMsg(chatInput)}>Send</button>
            </div>
          </>
        )}
      </Drawer>
        <div className="row" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Default Terms</label>
            <input className="input" value={terms} onChange={e => setTerms(e.target.value)} />
          </div>
          <div className="field">
            <label>Expected Delivery (set on accept)</label>
            <input type="date" className="input" value={expected} onChange={e => setExpected(e.target.value)} />
          </div>
        </div>
    </div>
  )
}

export default POs


