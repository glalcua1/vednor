import { useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useAppState } from '../state/AppStateContext'
import { RFQ, Quote } from '../state/types'
import Acronym from '../components/Acronym'
import Drawer from '../components/Drawer'
import { IconTrash, IconChat } from '../components/icons'
import { showToast } from '../utils/toast'

function RFQs({ query = '', setQuery }: { query?: string, setQuery?: (v: string) => void }) {
  const { state, updateRFQ, addRFQ, addPO, deleteRFQ, updatePR } = useAppState() as any
  const [sortKey, setSortKey] = useState<'id' | 'from' | 'date' | 'status' | 'invited' | 'quotes' | 'vendor'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const formatShortDate = (iso?: string) => {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const day = d.getDate().toString().padStart(2, '0')
    const mon = d.toLocaleString(undefined, { month: 'short' })
    const yr = (d.getFullYear() % 100).toString().padStart(2, '0')
    return `${day}/${mon}/${yr}`
  }
  const [hoverRFQId, setHoverRFQId] = useState<string | null>(null)
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
  const [fromPR, setFromPR] = useState('')
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [invited, setInvited] = useState<Record<string, boolean>>({})
  const invitedVendors = useMemo(() => Object.entries(invited).filter(([,v]) => v).map(([id]) => id), [invited])

  const [manageRFQ, setManageRFQ] = useState<RFQ | null>(null)
  const [quoteVendorId, setQuoteVendorId] = useState('')
  const [quotePrice, setQuotePrice] = useState<number>(0)
  const [quoteDays, setQuoteDays] = useState<number>(7)
  const [quoteTerms, setQuoteTerms] = useState('')
  const [quoteCurrency, setQuoteCurrency] = useState<string>('USD')
  const [recentQuoteId, setRecentQuoteId] = useState<string>('')
  // Chat state (similar to PO negotiation chat)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatRFQ, setChatRFQ] = useState<RFQ | null>(null)
  const [chatVendorId, setChatVendorId] = useState<string>('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Array<{ from: 'me' | 'vendor', text: string, ts: string }>>([])
  const aiPrompts = [
    'Could you consider a 5% reduction for upfront payment within 7 days?',
    'If we extend the term to 24 months, can you improve the unit rate?',
    'We noticed competitor quotes are lower—can you match or better them?',
    'We can commit to higher volumes. What discount can you offer for that?'
  ]
  function openChat(r: RFQ) {
    setChatRFQ(r)
    const defaultVendor = (() => {
      const awarded = r.selectedQuoteId ? r.quotes.find(q => q.id === r.selectedQuoteId)?.vendorId : undefined
      return awarded ?? r.invitedVendorIds[0] ?? ''
    })()
    setChatVendorId(defaultVendor)
    const vendor = state.vendors.find(v => v.id === defaultVendor)
    const intro = `Hello ${vendor?.contactPerson ?? 'Team'}, thanks for your interest. We’d like to discuss the quote.`
    setMessages([{ from: 'vendor', text: intro, ts: new Date().toISOString() }])
    setChatOpen(true)
  }
  // Default quote currency to PR currency when opening Manage RFQ
  if (manageRFQ) {
    const pr = state.prs.find(p => p.id === manageRFQ.fromPRId)
    if (pr && quoteCurrency !== (pr.currency ?? 'USD') && (quoteVendorId === '' && quotePrice === 0 && quoteDays === 7 && quoteTerms === '')) {
      setQuoteCurrency(pr.currency ?? 'USD')
    }
  }
  function sendChatMsg(text: string) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { from: 'me', text, ts: new Date().toISOString() }])
    setChatInput('')
  }

  function createRFQ() {
    if (!fromPR) return alert('Select a PR')
    const pr = state.prs.find(p => p.id === fromPR)
    if (!pr) return alert('Invalid PR')
    const inviteIds = invitedVendors.length ? invitedVendors : state.vendors.map(v => v.id)
    addRFQ({ fromPRId: pr.id, invitedVendorIds: inviteIds })
    // Keep PR in sync when RFQ is created from RFQ tab
    updatePR({ ...pr, status: 'Converted to RFQ' })
    setFromPR(''); setSuccess(true)
    setInvited({})
  }

  function addQuote(rfq: RFQ) {
    if (!quoteVendorId) return alert('Select a vendor')
    if (!quotePrice || !quoteDays) return alert('Enter price and days')
    const quote: Quote = { id: uuid(), vendorId: quoteVendorId, price: quotePrice, deliveryDays: quoteDays, notes: quoteTerms, currency: quoteCurrency }
    const updated = { ...rfq, quotes: [quote, ...rfq.quotes] }
    updateRFQ(updated)
    setManageRFQ(updated)
    setRecentQuoteId(quote.id)
    setTimeout(() => setRecentQuoteId(''), 3000)
    setQuoteVendorId(''); setQuotePrice(0); setQuoteDays(7); setQuoteTerms('')
    // keep currency selection as is for subsequent adds
    showToast('Quote added to the RFQ.', 'success')
  }

  function award(rfq: RFQ, quoteId: string) {
    const quote = rfq.quotes.find(q => q.id === quoteId)
    if (!quote) return
    const awardedRFQ = { ...rfq, selectedQuoteId: quoteId, status: 'Awarded' }
    updateRFQ(awardedRFQ)
    setManageRFQ(awardedRFQ)
    const pr = state.prs.find(p => p.id === rfq.fromPRId)
    const expectedDate = addBusinessDays(new Date().toISOString(), quote.deliveryDays)
    const baseTotal = pr ? pr.items.reduce((s, i) => s + i.quantity * i.unitCost, 0) : quote.price
    const vendor = state.vendors.find(v => v.id === quote.vendorId)
    const disc = typeof vendor?.discount === 'number' ? vendor.discount : 0
    const netTotal = baseTotal * (1 - (disc / 100))
    addPO({
      fromRFQId: rfq.id,
      fromPRId: rfq.fromPRId,
      vendorId: quote.vendorId,
      items: pr ? pr.items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unitCost: i.unitCost })) : [],
      total: Math.round(netTotal * 100) / 100,
      expectedDeliveryDate: expectedDate
    })
    if (pr) {
      updatePR({ ...pr, status: 'Converted to PO' })
    }
  }

  return (
    <div className="grid cols-1">
      <div className="section-title">
        <div className="row" style={{ flexWrap: 'nowrap' as any, width: '100%' }}>
          <div className="spacer" />
          <input
            className="input"
            style={{ height: 36, maxWidth: 360 }}
            placeholder="Search RFQs..."
            value={query}
            onChange={(e) => setQuery ? setQuery(e.target.value) : undefined}
          />
          <button className="btn primary" onClick={() => { setOpen(true); setSuccess(false) }}>Create RFQ</button>
        </div>
      </div>
      <div className="table-block">
        {(() => {
          const visibleRFQs = state.rfqs
            .filter((r) => {
              if (!query) return true
              const v = (() => {
                const q = r.quotes.find(q => q.id === r.selectedQuoteId)
                const vendor = q ? state.vendors.find(v => v.id === q.vendorId) : undefined
                return vendor?.name ?? ''
              })()
              const hay = [`RFQ-${r.id.slice(0,6)}`, `PR-${r.fromPRId.slice(0,6)}`, formatShortDate(r.createdAt), r.status, String(r.invitedVendorIds.length), String(r.quotes.length), v].join(' ').toLowerCase()
              return hay.includes(query.toLowerCase())
            })
          const rfqStatusCounts = (() => {
            const m = new Map<string, number>()
            visibleRFQs.forEach((r) => m.set(r.status, (m.get(r.status) ?? 0) + 1))
            return m
          })()
          return (
            <div className="table-header">
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <div><Acronym text="RFQs" /></div>
                <span className="badge blue">{visibleRFQs.length}</span>
              </div>
              <div className="row">
                {([...rfqStatusCounts.entries()] as Array<[string, number]>).map(([s, c]) => (
                  <span key={s} className={`badge ${s === 'Awarded' ? 'green' : s === 'Open' ? 'orange' : 'blue'}`}>{s}: {c}</span>
                ))}
              </div>
            </div>
          )
        })()}
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => { setSortKey('id'); setSortDir(sortKey === 'id' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>RFQ {sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('from'); setSortDir(sortKey === 'from' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>From PR {sortKey === 'from' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('date'); setSortDir(sortKey === 'date' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Date {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('status'); setSortDir(sortKey === 'status' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('invited'); setSortDir(sortKey === 'invited' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Invited {sortKey === 'invited' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('quotes'); setSortDir(sortKey === 'quotes' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Quotes {sortKey === 'quotes' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('vendor'); setSortDir(sortKey === 'vendor' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Awarded Vendor {sortKey === 'vendor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Discount</th>
              <th>Expected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.rfqs
              .filter(r => {
                if (!query) return true
                const v = (() => {
                  const q = r.quotes.find(q => q.id === r.selectedQuoteId)
                  const vendor = q ? state.vendors.find(v => v.id === q.vendorId) : undefined
                  return vendor?.name ?? ''
                })()
                const hay = [`RFQ-${r.id.slice(0,6)}`, `PR-${r.fromPRId.slice(0,6)}`, formatShortDate(r.createdAt), r.status, String(r.invitedVendorIds.length), String(r.quotes.length), v].join(' ').toLowerCase()
                return hay.includes(query.toLowerCase())
              })
              .sort((a, b) => {
                const dir = sortDir === 'asc' ? 1 : -1
                const vendorA = (() => {
                  const q = a.quotes.find(q => q.id === a.selectedQuoteId)
                  const v = q ? state.vendors.find(v => v.id === q.vendorId) : undefined
                  return v?.name ?? ''
                })()
                const vendorB = (() => {
                  const q = b.quotes.find(q => q.id === b.selectedQuoteId)
                  const v = q ? state.vendors.find(v => v.id === q.vendorId) : undefined
                  return v?.name ?? ''
                })()
                switch (sortKey) {
                  case 'id': return a.id.localeCompare(b.id) * dir
                  case 'from': return a.fromPRId.localeCompare(b.fromPRId) * dir
                  case 'date': return ((new Date(a.createdAt).getTime()) - (new Date(b.createdAt).getTime())) * dir
                  case 'status': return a.status.localeCompare(b.status) * dir
                  case 'invited': return (a.invitedVendorIds.length - b.invitedVendorIds.length) * dir
                  case 'quotes': return (a.quotes.length - b.quotes.length) * dir
                  case 'vendor': return vendorA.localeCompare(vendorB) * dir
                  default: return 0
                }
              })
              .map(r => (
              <tr key={r.id} className={(() => {
                const ms = Date.now() - new Date(r.createdAt).getTime()
                return ms < 5000 ? 'row-flash' : ''
              })()}>
                <td>RFQ-{r.id.slice(0,6)}</td>
                <td
                  onMouseEnter={() => setHoverRFQId(r.id)}
                  onMouseLeave={() => setHoverRFQId(prev => (prev === r.id ? null : prev))}
                  style={{ position: 'relative' }}
                >
                  PR-{r.fromPRId.slice(0,6)}
                  {hoverRFQId === r.id && (() => {
                    const pr = state.prs.find(p => p.id === r.fromPRId)
                    const requester = pr ? state.users.find(u => u.id === pr.requestedByUserId)?.name ?? pr.requestedByUserId : '-'
                    const currency = pr?.currency ?? 'USD'
                    return (
                      <div className="elevated" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#fff', padding: 12, borderRadius: 10, zIndex: 10, minWidth: 280, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>PR Details</div>
                        <div style={{ fontSize: 13, marginBottom: 4 }}>Requested by: {requester}</div>
                        <div style={{ fontSize: 13, marginBottom: 8 }}>Department: {pr?.department ?? '-'}</div>
                        <div style={{ fontSize: 13, marginBottom: 6 }}>Items:</div>
                        <div style={{ maxHeight: 140, overflow: 'auto' }}>
                          {(pr?.items ?? []).map(i => (
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
                <td>{formatShortDate(r.createdAt)}</td>
                <td><span className={`badge ${r.status === 'Awarded' ? 'green' : r.status === 'Open' ? 'orange' : 'blue'}`}>{r.status}</span></td>
                <td>{r.invitedVendorIds.length}</td>
                <td>{r.quotes.length}</td>
                <td>{(() => {
                  const q = r.quotes.find(q => q.id === r.selectedQuoteId)
                  const v = q ? state.vendors.find(v => v.id === q.vendorId) : undefined
                  return v ? v.name : '-'
                })()}</td>
                <td>{(() => {
                  const q = r.quotes.find(q => q.id === r.selectedQuoteId)
                  const v = q ? state.vendors.find(v => v.id === q.vendorId) : undefined
                  return typeof v?.discount === 'number' ? `${v.discount}%` : '-'
                })()}</td>
                <td>{(() => {
                  const q = r.quotes.find(q => q.id === r.selectedQuoteId)
                  if (!q) return '-'
                  const base = r.createdAt ?? new Date().toISOString()
                  return formatShortDate(addBusinessDays(base, q.deliveryDays))
                })()}</td>
                <td className="actions">
                  <button className="btn ghost small" title="Chat" onClick={() => openChat(r)}><IconChat /></button>
                  <button className="btn ghost small" onClick={() => setManageRFQ(r)}>Manage Quotes</button>
                  <button className="btn danger small" aria-label="Delete RFQ" onClick={() => { deleteRFQ(r.id); showToast('Request for Quotation deleted.', 'info') }}><IconTrash /></button>
                </td>
              </tr>
            ))}
            {state.rfqs.length === 0 && <tr><td colSpan={9}>No RFQs yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Drawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Vendor Chat"
        width={720}
        footer={
          <div className="row" style={{ width: '100%' }}>
            {aiPrompts.map((p, idx) => (
              <button key={idx} className="btn small ghost" onClick={() => sendChatMsg(p)}>{p}</button>
            ))}
          </div>
        }
      >
        {chatRFQ && (
          <>
            <div className="elevated" style={{ padding: 12, marginBottom: 12 }}>
              {(() => {
                const v = state.vendors.find(v => v.id === chatVendorId)
                return (
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{v?.name ?? '-'}</div>
                      <div style={{ color: 'var(--text-700)', fontSize: 12 }}>Point of contact: {v?.contactPerson ?? '-'}</div>
                    </div>
                    <div style={{ color: 'var(--text-700)', fontSize: 12 }}>RFQ-{chatRFQ.id.slice(0,6)}</div>
                  </div>
                )
              })()}
            </div>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <label className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-700)' }}>Chat with</span>
                <select className="select" value={chatVendorId} onChange={e => setChatVendorId(e.target.value)}>
                  {chatRFQ.invitedVendorIds.map(id => {
                    const v = state.vendors.find(v => v.id === id)
                    return v ? <option key={id} value={id}>{v.name}</option> : null
                  })}
                </select>
              </label>
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
              <button className="btn primary" onClick={() => sendChatMsg(chatInput)}>Send</button>
            </div>
          </>
        )}
      </Drawer>
      <Drawer
        open={open}
        onClose={() => { setOpen(false); setSuccess(false) }}
        title="Create RFQ"
        footer={!success && (
          <>
            <button className="btn ghost" onClick={() => { setOpen(false); setSuccess(false) }}>Cancel</button>
            <button className="btn primary" onClick={createRFQ}>Create RFQ</button>
          </>
        )}
      >
        {success ? (
          <div className="victory">
            <div className="check">✓</div>
            <h2>RFQ created</h2>
            <p>Your RFQ has been generated from the selected PR. Invite vendors to submit quotes and award the best offer to proceed with a PO.</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => { setOpen(false); setSuccess(false) }}>Close</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid cols-1">
              <div className="field">
                <label>Select PR</label>
                <select className="select" value={fromPR} onChange={e => setFromPR(e.target.value)}>
                  <option value="">Select a PR</option>
                  {state.prs.map(p => <option key={p.id} value={p.id}>PR-{p.id.slice(0,6)} · {p.department} · {p.expectedTotal.toFixed(2)}</option>)}
                </select>
              </div>
            </div>
            <div className="card" style={{ marginTop: 12 }}>
              <h3>Invite Vendors (optional)</h3>
              <div className="grid cols-3">
                {state.vendors.map(v => (
                  <label key={v.id} className="row" style={{ gap: 8 }}>
                    <input type="checkbox" checked={!!invited[v.id]} onChange={(e) => setInvited(prev => ({ ...prev, [v.id]: e.target.checked }))} />
                    <span>{v.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        open={!!manageRFQ}
        onClose={() => setManageRFQ(null)}
        title="Manage Quotes"
        width={960}
        footer={null}
      >
        {manageRFQ && (
          <>
            <div className="card">
              <h3>Add Quote</h3>
              <div className="grid cols-4">
                <div className="field">
                  <label>Vendor</label>
                  <select className="select" value={quoteVendorId} onChange={e => setQuoteVendorId(e.target.value)}>
                    <option value="">Select Vendor</option>
                    {manageRFQ.invitedVendorIds.map(id => {
                      const v = state.vendors.find(v => v.id === id)
                      return v ? <option key={id} value={id}>{v.name}</option> : null
                    })}
                  </select>
                </div>
                <div className="field">
                  <label>Currency</label>
                  <select className="select" value={quoteCurrency} onChange={e => setQuoteCurrency(e.target.value)}>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>INR</option>
                    <option>GBP</option>
                    <option>AED</option>
                    <option>SGD</option>
                  </select>
                </div>
                <div className="field">
                  <label>Price</label>
                  <input type="number" className="input" value={quotePrice} onChange={e => setQuotePrice(parseFloat(e.target.value || '0'))} />
                </div>
                <div className="field">
                  <label>Delivery Days</label>
                  <input type="number" className="input" value={quoteDays} onChange={e => setQuoteDays(parseInt(e.target.value || '0'))} />
                </div>
                <div className="field" style={{ gridColumn: 'span 4' as any }}>
                  <label>Terms</label>
                  <input className="input" value={quoteTerms} onChange={e => setQuoteTerms(e.target.value)} />
                </div>
              </div>
              <div className="row">
                <div className="spacer" />
                <button className="btn primary" onClick={() => addQuote(manageRFQ)}>Add Quote</button>
              </div>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <div className="table-block">
                <div className="table-header">Quotes</div>
                <table className="table">
                <thead><tr><th>Vendor</th><th>Price</th><th>Days</th><th>Terms</th><th>Discount</th><th>Net Price</th><th>Action</th></tr></thead>
                <tbody>
                  {manageRFQ.quotes.map(q => {
                    const v = state.vendors.find(v => v.id === q.vendorId)
                    const awarded = manageRFQ.selectedQuoteId === q.id
                    const disc = typeof v?.discount === 'number' ? v.discount : undefined
                    const net = typeof disc === 'number' ? q.price * (1 - disc / 100) : q.price
                    return (
                      <tr key={q.id} className={recentQuoteId === q.id ? 'row-flash' : ''}>
                        <td>{v?.name ?? q.vendorId}</td>
                        <td>{q.currency ?? (state.prs.find(p => p.id === manageRFQ.fromPRId)?.currency ?? 'USD')} {q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{q.deliveryDays}</td>
                        <td>{q.notes ?? '-'}</td>
                        <td>{typeof disc === 'number' ? `${disc}%` : '-'}</td>
                        <td>{q.currency ?? (state.prs.find(p => p.id === manageRFQ.fromPRId)?.currency ?? 'USD')} {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>
                          {awarded ? (
                            <span className="badge green">Awarded</span>
                          ) : (
                            <button className="btn small" onClick={() => award(manageRFQ, q.id)}>Award</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {manageRFQ.quotes.length === 0 && <tr><td colSpan={7}>No quotes yet.</td></tr>}
                </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default RFQs


