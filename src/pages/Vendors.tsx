import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useNavigate } from 'react-router-dom'
import { Vendor, Invoice, PurchaseOrder, PurchaseRequisition } from '../state/types'
import Drawer from '../components/Drawer'
import { IconTrash } from '../components/icons'
import { showToast } from '../utils/toast'

type ChatMessage = {
  id: string
  sender: 'Me' | 'Vendor'
  text: string
  attachmentUrl?: string
  timestamp: string
}

const emptyVendor: Omit<Vendor, 'id' | 'status' | 'documents'> = {
  name: '',
  category: 'Software',
  contactPerson: '',
  email: '',
  phone: '',
  bank: '',
  taxId: '',
  risk: 'Low',
  rating: 4,
  discount: 0,
  contractUrl: ''
}

function Vendors() {
  const { state, addVendor, updateVendor, deleteVendor } = useAppState() as any
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyVendor)
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [riskFilter, setRiskFilter] = useState<string>('All')
  const [activeTab, setActiveTab] = useState<'Details' | 'Chat'>('Details')
  const [chatMap, setChatMap] = useState<Map<string, ChatMessage[]>>(new Map())
  const [chatInput, setChatInput] = useState('')
  const [recentVendorId, setRecentVendorId] = useState<string>('')
  const prevCountRef = useRef<number>(state.vendors.length)
  useEffect(() => {
    if (state.vendors.length > prevCountRef.current) {
      const newest = state.vendors[0]
      if (newest) {
        setRecentVendorId(newest.id)
        setTimeout(() => setRecentVendorId(''), 3000)
      }
    }
    prevCountRef.current = state.vendors.length
  }, [state.vendors.length])

  const vendorSpend = useMemo(() => {
    const m = new Map<string, number>()
    state.invoices.forEach((i: Invoice) => {
      const prev = m.get(i.vendorId) ?? 0
      m.set(i.vendorId, prev + i.amount)
    })
    return m
  }, [state.invoices])
  const vendorOpenPOs = useMemo(() => {
    const m = new Map<string, number>()
    state.pos.forEach((p: PurchaseOrder) => {
      if (p.status !== 'Closed') m.set(p.vendorId, (m.get(p.vendorId) ?? 0) + 1)
    })
    return m
  }, [state.pos])
  const vendorCurrency = useMemo(() => {
    const m = new Map<string, string>()
    state.pos.forEach((p: PurchaseOrder) => {
      const pr = p.fromPRId ? state.prs.find((pr: PurchaseRequisition) => pr.id === p.fromPRId) : undefined
      if (pr) m.set(p.vendorId, pr.currency ?? 'USD')
    })
    return m
  }, [state.pos, state.prs])

  const filtered = useMemo(() => {
    return state.vendors.filter((v: Vendor) => {
      const byName = v.name.toLowerCase().includes(filter.toLowerCase())
      const byCat = categoryFilter === 'All' || v.category === categoryFilter
      const byRisk = riskFilter === 'All' || v.risk === riskFilter
      return byName && byCat && byRisk
    })
  }, [state.vendors, filter, categoryFilter, riskFilter])
  const statusCounts = useMemo(() => {
    const m = new Map<string, number>()
    filtered.forEach((v: Vendor) => {
      m.set(v.status, (m.get(v.status) ?? 0) + 1)
    })
    return m
  }, [filtered])

  function openAdd() { setForm(emptyVendor); setEditing(null); setOpen(true); setSuccess(false) }
  function save() {
    if (editing) {
      const updatedDocs = (() => {
        const docs = [...(editing.documents ?? [])]
        if (form.contractUrl && !docs.includes(form.contractUrl)) docs.push(form.contractUrl)
        return docs
      })()
      updateVendor({ ...editing, ...form, documents: updatedDocs })
      setEditing(null)
      setOpen(false)
    } else {
      const docs = form.contractUrl ? [form.contractUrl] : []
      addVendor({ ...form, documents: docs })
      setSuccess(true)
    }
  }

  function ensureChat(vendorId: string) {
    if (!chatMap.has(vendorId)) {
      const sample = `SaaS Master Services Agreement (Sample)
Parties: Your Company and Vendor
Term: 12 months
Fees: As per attached rate card
Discount: Negotiated discount applies
SLAs: 99.9% uptime; support within 1 business day
Termination: 30 days written notice
Governing Law: Delaware
Signatures: Authorized signatories
Date: ${new Date().toISOString().slice(0,10)}`
      const sampleUrl = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(sample)))
      const seed: ChatMessage[] = [
        { id: crypto.randomUUID(), sender: 'Me', text: 'Hello! Sharing a sample contract for review.', attachmentUrl: sampleUrl, timestamp: new Date().toISOString() },
        { id: crypto.randomUUID(), sender: 'Vendor', text: 'Received. Let’s review the terms and discount.', timestamp: new Date(Date.now()+1000).toISOString() }
      ]
      const next = new Map(chatMap)
      next.set(vendorId, seed)
      setChatMap(next)
    }
  }

  function postMessage(vendorId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const list = chatMap.get(vendorId) ?? []
    const next = new Map(chatMap)
    next.set(vendorId, [...list, { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString() }])
    setChatMap(next)
  }

  function onUploadContract(file?: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result ?? '')
      setForm({ ...form, contractUrl: url })
      showToast('Contract uploaded for this vendor (not yet saved).', 'info')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid cols-1">
      <div className="row" style={{ margin: '12px 0' }}>
        <div className="row" style={{ gap: 8 }}>
          <select className="select inline" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option>All</option>
            <option>Software</option>
            <option>Hardware</option>
            <option>Office Supplies</option>
            <option>Services</option>
            <option>Other</option>
          </select>
          <select className="select inline" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div className="spacer" />
        <input className="input" placeholder="Search vendors..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 320 }} />
        <button className="btn primary" onClick={openAdd}>Add Vendor</button>
      </div>

      <div className="table-block">
        <div className="table-header">
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <div>Vendors</div>
            <span className="badge blue">{filtered.length}</span>
          </div>
          <div className="row">
            {([...statusCounts.entries()] as Array<[string, number]>).map(([s, c]) => (
              <span key={s} className={`badge ${s === 'Approved' ? 'green' : s === 'Pending Approval' ? 'orange' : s === 'Restricted' ? 'red' : 'blue'}`}>{s}: {c}</span>
            ))}
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Rating</th>
              <th>Spend</th>
              <th>Open POs</th>
              <th className="actions"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v: Vendor) => (
              <tr key={v.id} className={recentVendorId === v.id ? 'row-flash' : ''}>
                <td>{v.name}</td>
                <td>{v.category}</td>
                <td>{v.contactPerson} ({v.email})</td>
                <td><span className={`badge ${v.status === 'Approved' ? 'green' : v.status === 'Pending Approval' ? 'orange' : 'red'}`}>{v.status}</span></td>
                <td><span className={`badge ${v.risk === 'Low' ? 'green' : v.risk === 'Medium' ? 'orange' : 'red'}`}>{v.risk}</span></td>
                <td>{'★'.repeat(v.rating ?? 0)}{(v.rating ?? 0) < 5 ? '☆'.repeat(5 - (v.rating ?? 0)) : ''}</td>
                <td>{vendorCurrency.get(v.id) ?? 'USD'} {(vendorSpend.get(v.id) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  {(() => {
                    const openPOs = state.pos.filter((p: PurchaseOrder) => p.vendorId === v.id && p.status !== 'Closed')
                    const title = openPOs.map((p: PurchaseOrder) => `PO-${p.id.slice(0,6)}`).join(', ')
                    const count = openPOs.length
                    return (
                      <button
                        className="btn small ghost"
                        title={count > 0 ? title : 'No open POs'}
                        onClick={() => { if (count > 0) navigate(`/prs?tab=PO&vendorId=${v.id}`) }}
                      >
                        {count}
                      </button>
                    )
                  })()}
                </td>
                <td className="actions">
                  <div className="row">
                    <button className="btn ghost small" onClick={() => { setEditing(v); setForm(v); setOpen(true); setSuccess(false) }}>Edit</button>
                    {v.status !== 'Approved' && <button className="btn primary small" onClick={() => updateVendor({ ...v, status: 'Approved' })}>Approve</button>}
                    <button className="btn danger small" aria-label="Delete vendor" onClick={() => { deleteVendor(v.id); showToast('Vendor deleted successfully.', 'info') }}><IconTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7}>No vendors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={open}
        onClose={() => { setOpen(false); setSuccess(false) }}
        title={editing ? 'Edit Vendor' : 'Add Vendor'}
        footer={!success && (
          <>
            <button className="btn ghost" onClick={() => { setOpen(false); setSuccess(false) }}>Cancel</button>
            <button className="btn primary" onClick={save}>{editing ? 'Save Changes' : 'Submit'}</button>
          </>
        )}
      >
        {success ? (
          <div className="victory">
            <div className="check">✓</div>
            <h2>Vendor submitted successfully</h2>
            <p>Your vendor information has been received and routed for approval. You can track status on the Vendors page. We’ll notify you if additional verification is required.</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => { setOpen(false); setSuccess(false) }}>Close</button>
            </div>
          </div>
        ) : (
          <>
            <div className="tabs" style={{ marginBottom: 12 }}>
              <div
                className={`tab ${activeTab === 'Details' ? 'active' : ''}`}
                onClick={() => setActiveTab('Details')}
              >
                Vendor Details
              </div>
              <div
                className={`tab ${activeTab === 'Chat' ? 'active' : ''}`}
                onClick={() => { setActiveTab('Chat'); if (editing) ensureChat(editing.id) }}
              >
                Chat
              </div>
            </div>
            {activeTab === 'Details' && (
              <div className="grid cols-2">
                <div className="field">
                  <label>Name</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}>
                    <option>Software</option>
                    <option>Hardware</option>
                    <option>Office Supplies</option>
                    <option>Services</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label>Contact Person</label>
                  <input className="input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="field">
                  <label>Bank</label>
                  <input className="input" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
                </div>
                <div className="field">
                  <label>Tax ID</label>
                  <input className="input" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} />
                </div>
                <div className="field">
                  <label>Risk</label>
                  <select className="select" value={form.risk} onChange={e => setForm({ ...form, risk: e.target.value as any })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="field">
                  <label>Rating</label>
                  <input type="number" className="input" value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value || '0') })} />
                </div>
                <div className="field">
                  <label>Agreed Discount (%)</label>
                  <input type="number" className="input" value={form.discount ?? 0} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value || '0') })} />
                </div>
                <div className="field">
                  <label>Upload Contract</label>
                  <input type="file" className="input" onChange={e => onUploadContract(e.target.files?.[0])} />
                  {(form.contractUrl || editing?.contractUrl) && (
                    <div style={{ marginTop: 8 }}>
                      <a className="btn small ghost" href={form.contractUrl || editing?.contractUrl} target="_blank" rel="noreferrer">Preview Contract</a>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'Chat' && (
              <div className="grid cols-1">
                {!editing ? (
                  <div className="field">
                    <p>Save the vendor first to start a chat.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-block" style={{ maxHeight: 420, overflow: 'auto' }}>
                      <div className="table">
                        <div style={{ padding: 8 }}>
                          {(chatMap.get(editing.id) ?? []).map(m => (
                            <div key={m.id} className="row" style={{ alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                              <span className={`badge ${m.sender === 'Me' ? 'blue' : 'green'}`}>{m.sender}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, lineHeight: '20px' }}>{m.text}</div>
                                {m.attachmentUrl && (
                                  <div style={{ marginTop: 4 }}>
                                    <a className="btn small ghost" href={m.attachmentUrl} target="_blank" rel="noreferrer">Open Attachment</a>
                                  </div>
                                )}
                                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{new Date(m.timestamp).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8, marginTop: 8 }}>
                      <input className="input" placeholder="Type a message…" value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ fontSize: 14 }} />
                      <button
                        className="btn primary"
                        onClick={() => {
                          if (!chatInput.trim()) return
                          postMessage(editing.id, { sender: 'Me', text: chatInput.trim() })
                          setChatInput('')
                        }}
                      >
                        Send
                      </button>
                    </div>
                    <div className="row" style={{ gap: 8, marginTop: 8 }}>
                      <button
                        className="btn ghost small"
                        onClick={() => {
                          const rate = (form.discount ?? editing.discount ?? 0) || 0
                          postMessage(editing.id, { sender: 'Me', text: `Sharing negotiated rate: ${rate}% discount.` })
                        }}
                      >
                        Share Negotiated Rate
                      </button>
                      <button
                        className="btn ghost small"
                        onClick={() => {
                          const sample = `SaaS Master Services Agreement (Sample)
Key Points:
- Term: 12 months
- Uptime SLA: 99.9%
- Support: 1 business day
- Discount: As per negotiated rate`
                          const url = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(sample)))
                          postMessage(editing.id, { sender: 'Me', text: 'Attaching sample contract for review.', attachmentUrl: url })
                        }}
                      >
                        Attach Sample Contract
                      </button>
                      {(form.contractUrl || editing.contractUrl) && (
                        <button
                          className="btn ghost small"
                          onClick={() => {
                            postMessage(editing.id, { sender: 'Me', text: 'Sharing uploaded signed contract.', attachmentUrl: form.contractUrl || editing.contractUrl })
                          }}
                        >
                          Share Uploaded Contract
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default Vendors


