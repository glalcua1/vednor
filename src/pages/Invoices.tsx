import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import Acronym from '../components/Acronym'
import { IconDownload, IconMail } from '../components/icons'
import Drawer from '../components/Drawer'
import { Invoice } from '../state/types'

function Invoices({ query = '' }: { query?: string }) {
  const { state, addInvoice, updateInvoice } = useAppState()
  const [poId, setPoId] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [due, setDue] = useState<string>('')
  const [sortKey, setSortKey] = useState<'id' | 'po' | 'vendor' | 'amount' | 'due' | 'match' | 'status' | 'date'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [hoverPR, setHoverPR] = useState<string | null>(null)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  function submit() {
    if (!poId || !amount || !due) return alert('Fill all fields.')
    const po = state.pos.find(p => p.id === poId)
    if (!po) return alert('Invalid PO')
    addInvoice({ vendorId: po.vendorId, poId, amount, dueDate: due })
    setPoId(''); setAmount(0); setDue('')
  }

  return (
    <div className="grid cols-1">
      <div className="card">
        <div className="section-title"><h3>Submit Invoice</h3></div>
        <div className="grid cols-3">
          <div className="field">
            <label>PO</label>
            <select className="select" value={poId} onChange={e => setPoId(e.target.value)}>
              <option value="">Select PO</option>
              {state.pos.map(p => <option key={p.id} value={p.id}>PO-{p.id.slice(0,6)} · {p.total.toFixed(2)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Amount</label>
            <input type="number" className="input" value={amount} onChange={e => setAmount(parseFloat(e.target.value || '0'))} />
          </div>
          <div className="field">
            <label>Due Date</label>
            <input type="date" className="input" value={due} onChange={e => setDue(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <button className="btn primary" onClick={submit}>Upload</button>
        </div>
      </div>

      <div className="table-block">
        {(() => {
          const visibleInvoices = state.invoices
            .filter((i) => {
              if (!query) return true
              const vendor = state.vendors.find(v => v.id === i.vendorId)
              const po = state.pos.find(p => p.id === i.poId)
              const prCurrency = po ? (state.prs.find(p => p.id === po.fromPRId)?.currency ?? 'USD') : 'USD'
              const hay = [
                `INV-${i.id.slice(0,6)}`,
                `PO-${i.poId.slice(0,6)}`,
                vendor?.name ?? '',
                String(i.amount),
                prCurrency,
                new Date(i.dueDate).toLocaleDateString(),
                i.threeWayMatch ? 'Matched' : 'Mismatch',
                i.status
              ].join(' ').toLowerCase()
              return hay.includes(query.toLowerCase())
            })
          const invStatusCounts = (() => {
            const m = new Map<string, number>()
            visibleInvoices.forEach((i) => m.set(i.status, (m.get(i.status) ?? 0) + 1))
            return m
          })()
          return (
            <div className="table-header">
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <div>Invoices</div>
                <span className="badge blue">{visibleInvoices.length}</span>
              </div>
              <div className="row">
                {([...invStatusCounts.entries()] as Array<[string, number]>).map(([s, c]) => (
                  <span key={s} className={`badge ${s === 'Paid' ? 'green' : s === 'Overdue' ? 'red' : s === 'Submitted' ? 'orange' : 'blue'}`}>{s}: {c}</span>
                ))}
              </div>
            </div>
          )
        })()}
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => { setSortKey('id'); setSortDir(sortKey === 'id' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Invoice {sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('po'); setSortDir(sortKey === 'po' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}><Acronym text="POs" /> {sortKey === 'po' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('date'); setSortDir(sortKey === 'date' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Date {sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>From PR</th>
              <th onClick={() => { setSortKey('vendor'); setSortDir(sortKey === 'vendor' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Vendor {sortKey === 'vendor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('amount'); setSortDir(sortKey === 'amount' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Amount {sortKey === 'amount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('due'); setSortDir(sortKey === 'due' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Due {sortKey === 'due' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('match'); setSortDir(sortKey === 'match' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>3-Way Match {sortKey === 'match' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortKey('status'); setSortDir(sortKey === 'status' && sortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.invoices
              .filter(i => {
                if (!query) return true
                const vendor = state.vendors.find(v => v.id === i.vendorId)
                const po = state.pos.find(p => p.id === i.poId)
                const prCurrency = po ? (state.prs.find(p => p.id === po.fromPRId)?.currency ?? 'USD') : 'USD'
                const hay = [
                  `INV-${i.id.slice(0,6)}`,
                  `PO-${i.poId.slice(0,6)}`,
                  vendor?.name ?? '',
                  String(i.amount),
                  prCurrency,
                  new Date(i.dueDate).toLocaleDateString(),
                  i.threeWayMatch ? 'Matched' : 'Mismatch',
                  i.status
                ].join(' ').toLowerCase()
                return hay.includes(query.toLowerCase())
              })
              .sort((a, b) => {
                const dir = sortDir === 'asc' ? 1 : -1
                const vendorA = state.vendors.find(v => v.id === a.vendorId)?.name ?? ''
                const vendorB = state.vendors.find(v => v.id === b.vendorId)?.name ?? ''
                switch (sortKey) {
                  case 'date': return ((new Date(a.createdAt).getTime()) - (new Date(b.createdAt).getTime())) * dir
                  case 'id': return a.id.localeCompare(b.id) * dir
                  case 'po': return a.poId.localeCompare(b.poId) * dir
                  case 'vendor': return vendorA.localeCompare(vendorB) * dir
                  case 'amount': return (a.amount - b.amount) * dir
                  case 'due': return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir
                  case 'match': return ((a.threeWayMatch ? 1 : 0) - (b.threeWayMatch ? 1 : 0)) * dir
                  case 'status': return a.status.localeCompare(b.status) * dir
                  default: return 0
                }
              })
              .map(i => {
              const vendor = state.vendors.find(v => v.id === i.vendorId)
              const po = state.pos.find(p => p.id === i.poId)
              const prCurrency = po ? (state.prs.find(p => p.id === po.fromPRId)?.currency ?? 'USD') : 'USD'
              return (
              <tr key={i.id} className={(() => {
                const ms = Date.now() - new Date(i.createdAt).getTime()
                return ms < 5000 ? 'row-flash' : ''
              })()}>
                <td>
                  <button className="btn ghost small" onClick={() => setViewInvoice(i)}>
                    INV-{i.id.slice(0,6)}
                  </button>
                </td>
                  <td>PO-{i.poId.slice(0,6)}</td>
                <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                  <td
                    onMouseEnter={() => setHoverPR(po?.fromPRId ?? null)}
                    onMouseLeave={() => setHoverPR(prev => (prev === (po?.fromPRId ?? null) ? null : prev))}
                    style={{ position: 'relative' }}
                  >
                    {po?.fromPRId ? `PR-${po.fromPRId.slice(0,6)}` : '-'}
                    {po?.fromPRId && hoverPR === po.fromPRId && (() => {
                      const pr = state.prs.find(p2 => p2.id === po.fromPRId)
                      const currency = pr?.currency ?? 'USD'
                      const requester = pr ? state.users.find(u => u.id === pr.requestedByUserId)?.name ?? pr.requestedByUserId : '-'
                      return (
                        <div className="elevated" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#fff', padding: 12, borderRadius: 10, zIndex: 10, minWidth: 280, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>PR Details</div>
                          <div style={{ fontSize: 13, marginBottom: 4 }}>Requested by: {requester}</div>
                          <div style={{ fontSize: 13, marginBottom: 8 }}>Department: {pr?.department ?? '-'}</div>
                          <div style={{ fontSize: 13, marginBottom: 6 }}>Items:</div>
                          <div style={{ maxHeight: 140, overflow: 'auto' }}>
                            {(pr?.items ?? []).map(it => (
                              <div key={it.id} style={{ fontSize: 13, display: 'flex', gap: 8, marginBottom: 4 }}>
                                <div style={{ flex: 1, opacity: .9 }}>{it.description}</div>
                                <div style={{ whiteSpace: 'nowrap' }}>{it.quantity} × {currency} {it.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                  <td>{vendor?.name ?? '-'}</td>
                  <td>{prCurrency} {i.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{new Date(i.dueDate).toLocaleDateString()}</td>
                  <td>
                    {i.threeWayMatch ? (
                      <span className="badge green">Matched</span>
                    ) : (
                      <>
                        <span className="badge orange">Mismatch</span>{' '}
                        <abbr title="3-way match compares PO, Goods Receipt (delivery confirmation), and Invoice for items, quantities, and prices. A mismatch occurs if any differ or if receipt is missing. Fix by: confirming delivery (GRN), ensuring invoice quantities/prices match the PO, or updating the PO if there were agreed changes.">?</abbr>
                      </>
                    )}
                  </td>
                  <td><span className={`badge ${i.status === 'Paid' ? 'green' : i.status === 'Submitted' ? 'orange' : 'blue'}`}>{i.status}</span></td>
                  <td className="actions">
                    {i.status === 'Submitted' && <button className="btn small primary" onClick={() => updateInvoice({ ...i, status: 'Approved' })}>Approve</button>}
                    {i.status !== 'Paid' ? (
                      <button className="btn small ghost" onClick={() => updateInvoice({ ...i, status: 'Paid' })}>Mark Paid</button>
                    ) : (
                      <>
                        <button
                          className="btn small ghost"
                          title="Download invoice (PDF)"
                          onClick={() => {
                            const vendor = state.vendors.find(v => v.id === i.vendorId)
                            const po = state.pos.find(p => p.id === i.poId)
                            const prCurrency = po ? (state.prs.find(p => p.id === po.fromPRId)?.currency ?? 'USD') : 'USD'
                            const html = `
                              <html>
                                <head><title>Invoice INV-${i.id.slice(0,6)}</title></head>
                                <body>
                                  <h1>Invoice INV-${i.id.slice(0,6)}</h1>
                                  <p>Vendor: ${vendor?.name ?? '-'}</p>
                                  <p>PO: PO-${i.poId.slice(0,6)}</p>
                                  <p>Amount: ${prCurrency} ${i.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p>Due: ${new Date(i.dueDate).toLocaleDateString()}</p>
                                </body>
                              </html>`
                            const blob = new Blob([html], { type: 'text/html' })
                            const url = URL.createObjectURL(blob)
                            const w = window.open(url, '_blank')
                            if (w) w.focus()
                          }}
                        ><IconDownload /></button>
                        <button
                          className="btn small ghost"
                          title="Email invoice"
                          onClick={() => {
                            const vendor = state.vendors.find(v => v.id === i.vendorId)
                            const po = state.pos.find(p => p.id === i.poId)
                            const prCurrency = po ? (state.prs.find(p => p.id === po.fromPRId)?.currency ?? 'USD') : 'USD'
                            const subject = encodeURIComponent(`Invoice INV-${i.id.slice(0,6)}`)
                            const body = encodeURIComponent(`Dear ${vendor?.contactPerson ?? 'Team'},\n\nPlease find invoice INV-${i.id.slice(0,6)} for ${prCurrency} ${i.amount.toFixed(2)}.\n\nRegards,\nAccounts`)
                            window.location.href = `mailto:${vendor?.email ?? ''}?subject=${subject}&body=${body}`
                          }}
                        ><IconMail /></button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {state.invoices.length === 0 && <tr><td colSpan={8}>No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Drawer
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={viewInvoice ? `Invoice INV-${viewInvoice.id.slice(0,6)}` : 'Invoice'}
        width={720}
        footer={
          viewInvoice ? (
            <>
              <button className="btn ghost" onClick={() => setViewInvoice(null)}>Close</button>
              {viewInvoice.status !== 'Paid' && (
                <button className="btn primary" onClick={() => { updateInvoice({ ...viewInvoice, status: 'Paid' }); setViewInvoice(null) }}>Mark Paid</button>
              )}
            </>
          ) : null
        }
      >
        {viewInvoice && (
          <div className="grid cols-2">
            <div className="field">
              <label>Invoice</label>
              <div>INV-{viewInvoice.id.slice(0,6)}</div>
            </div>
            <div className="field">
              <label>Date</label>
              <div>{new Date(viewInvoice.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="field">
              <label>Vendor</label>
              <div>{state.vendors.find(v => v.id === viewInvoice.vendorId)?.name ?? '-'}</div>
            </div>
            <div className="field">
              <label>Vendor Discount</label>
              <div>{(() => {
                const vendor = state.vendors.find(v => v.id === viewInvoice.vendorId)
                return typeof vendor?.discount === 'number' ? `${vendor.discount}%` : '-'
              })()}</div>
            </div>
            <div className="field">
              <label>PO</label>
              <div>PO-{viewInvoice.poId.slice(0,6)}</div>
            </div>
            <div className="field">
              <label>From PR</label>
              <div>{(() => {
                const po = state.pos.find(p => p.id === viewInvoice.poId)
                return po?.fromPRId ? `PR-${po.fromPRId.slice(0,6)}` : '-'
              })()}</div>
            </div>
            <div className="field">
              <label>Amount</label>
              <div>{(() => {
                const po = state.pos.find(p => p.id === viewInvoice.poId)
                const prCurr = po ? (state.prs.find(p2 => p2.id === po.fromPRId)?.currency ?? 'USD') : 'USD'
                return `${prCurr} ${viewInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              })()}</div>
            </div>
            <div className="field">
              <label>Due</label>
              <div>{new Date(viewInvoice.dueDate).toLocaleDateString()}</div>
            </div>
            <div className="field">
              <label>Status</label>
              <div><span className={`badge ${viewInvoice.status === 'Paid' ? 'green' : viewInvoice.status === 'Submitted' ? 'orange' : 'blue'}`}>{viewInvoice.status}</span></div>
            </div>
            <div className="field" style={{ gridColumn: 'span 2' as any }}>
              <label>
                3-Way Match{' '}
                <abbr title="3-way match compares PO, Goods Receipt (delivery confirmation), and Invoice for items, quantities, and prices. A mismatch occurs if any differ or if receipt is missing. Fix by: confirming delivery (GRN), ensuring invoice quantities/prices match the PO, or updating the PO if there were agreed changes.">?</abbr>
              </label>
              <div>
                {viewInvoice.threeWayMatch ? (
                  'Matched'
                ) : (
                  <>
                    Mismatch
                    <div style={{ fontSize: 12, color: 'var(--text-700)', marginTop: 4 }}>
                      How to fix: Confirm delivery (GRN) on the PO, ensure invoice quantity/unit price matches the PO, or update the PO if terms changed.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Invoices


