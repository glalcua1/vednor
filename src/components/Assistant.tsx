import { useEffect, useMemo, useState } from 'react'
import Drawer from './Drawer'
import { IconChat } from './icons'
import { useAppState } from '../state/AppStateContext'
import { PurchaseRequisition, RFQ, PurchaseOrder } from '../state/types'
import { useNavigate } from 'react-router-dom'

type Msg = { role: 'user' | 'assistant', text: string, ts: string }

function Assistant() {
  const { state } = useAppState() as any
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: 'Hi! I can help you check PR status or guide you on adding Vendors, PRs, or RFQs. Try asking for a PR status by id.', ts: new Date().toISOString() }
  ])
  const [drawerBlocking, setDrawerBlocking] = useState(false)

  const isEmployee = state.currentUser.role === 'Requestor'

  function formatShortDate(iso?: string) {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const day = d.getDate().toString().padStart(2, '0')
    const mon = d.toLocaleString(undefined, { month: 'short' })
    const yr = (d.getFullYear() % 100).toString().padStart(2, '0')
    return `${day}/${mon}/${yr}`
  }

  function computePRStatus(pr: PurchaseRequisition): string {
    const po = state.pos.find((po: PurchaseOrder) => po.fromPRId === pr.id)
    if (po?.deliveryConfirmed) return 'Delivered'
    if (po) return 'Converted to PO'
    const rfq = state.rfqs.find((r: RFQ) => r.fromPRId === pr.id)
    if (rfq?.status === 'Awarded') return 'RFQ Awarded'
    if (rfq) return 'Converted to RFQ'
    return pr.status
  }

  function resolve(query: string): string {
    const q = query.toLowerCase().trim()
    // PR status by id like PR-xxxxxx
    const prMatch = q.match(/pr[-\s]?([a-z0-9]{4,8})/i)
    if (q.includes('status') && prMatch) {
      const prefix = prMatch[1]
      const pr = state.prs.find((p: PurchaseRequisition) => p.id.startsWith(prefix))
      if (!pr) return `I could not find PR with id starting "${prefix}".`
      const status = computePRStatus(pr)
      return `Status of PR-${pr.id.slice(0,6)}: ${status} • Created ${formatShortDate(pr.createdAt)} • Dept ${pr.department} • Total ${(pr.currency ?? 'USD')} ${pr.expectedTotal.toLocaleString()}`
    }
    if (q.includes('status') && q.includes('pr')) {
      // Latest 5 PRs
      const list = [...state.prs]
        .filter((p: PurchaseRequisition) => isEmployee ? p.requestedByUserId === state.currentUser.id : true)
        .sort((a: PurchaseRequisition, b: PurchaseRequisition) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((p: PurchaseRequisition) => `PR-${p.id.slice(0,6)} • ${computePRStatus(p)} • ${formatShortDate(p.createdAt)} • ${(p.currency ?? 'USD')} ${p.expectedTotal.toLocaleString()}`)
      return list.length ? `Latest PRs:\n- ${list.join('\n- ')}` : 'No PRs found.'
    }
    if (q.includes('how') && q.includes('add') && q.includes('vendor')) {
      return [
        'Add a Vendor:',
        '1) Go to Vendors.',
        '2) Click "Add Vendor".',
        '3) Fill in details, discount and upload contract.',
        '4) Submit to route for approval.'
      ].join('\n')
    }
    if ((q.includes('how') && (q.includes('create') || q.includes('add'))) && q.includes('pr')) {
      return [
        'Create a PR:',
        '1) Go to PRs tab.',
        '2) Click "Add Purchase Requisition".',
        '3) Fill dept, budget, justification.',
        '4) Add items manually or use "Select from Marketplace".',
        '5) Submit PR for approval.'
      ].join('\n')
    }
    if ((q.includes('how') && (q.includes('create') || q.includes('add'))) && q.includes('rfq')) {
      return [
        'Create an RFQ:',
        '1) Go to PRs → RFQ tab.',
        '2) Click "Create RFQ" and choose a PR.',
        '3) Invite vendors and add quotes.',
        '4) Award a quote to progress to PO.'
      ].join('\n')
    }
    if (q.includes('help')) {
      return 'I can help with PR status and steps to add Vendor/PR/RFQ. Try: "Status of PR-ABC123"'
    }
    return 'Sorry, I did not understand. Try "Status of PR-ABC123" or "How to create an RFQ".'
  }

  function send(text: string) {
    if (!text.trim()) return
    const userMsg: Msg = { role: 'user', text: text.trim(), ts: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    const reply = resolve(text)
    const botMsg: Msg = { role: 'assistant', text: reply, ts: new Date().toISOString() }
    setMessages(prev => [...prev, botMsg])
    setInput('')
  }

  const suggestions = useMemo(() => {
    const latest = [...state.prs]
      .sort((a: PurchaseRequisition, b: PurchaseRequisition) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const prSuggest = latest ? `Status of PR-${latest.id.slice(0,6)}` : 'How to create a PR?'
    return [
      prSuggest,
      'How to add a Vendor?',
      'How to create a PR?',
      'How to create an RFQ?',
    ]
  }, [state.prs])

  useEffect(() => {
    // Hide FAB when any drawer/overlay is open
    const update = () => {
      const anyOpen = !!document.querySelector('.drawer.open') || !!document.querySelector('.drawer-overlay.open')
      setDrawerBlocking(anyOpen)
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { attributes: true, childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <button
        className="assistant-fab"
        aria-label="AI Assistant"
        title="AI Assistant"
        onClick={() => setOpen(true)}
        style={drawerBlocking ? { display: 'none' } : undefined}
      >
        <IconChat />
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="AI Assistant"
        width={420}
        footer={
          <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' as any }}>
              {suggestions.map(s => (
                <button key={s} className="btn small ghost" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
            <div className="row">
              <button className="btn ghost small" onClick={() => navigate('/prs')}>Go to PRs</button>
              <button className="btn ghost small" onClick={() => navigate('/vendors')}>Go to Vendors</button>
            </div>
          </div>
        }
      >
        <div className="grid cols-1">
          <div className="elevated" style={{ background: '#fff', borderRadius: 10, padding: 12, height: 340, overflow: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{ maxWidth: '80%', padding: '8px 10px', borderRadius: 10, background: m.role === 'user' ? 'var(--brand-50)' : '#f1f5fb', color: 'var(--text-900)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', fontSize: 14 }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <input className="input" placeholder='Ask "Status of PR-XXXXXX" or "How to create an RFQ?"' value={input} onChange={e => setInput(e.target.value)} style={{ fontSize: 14 }} />
            <button className="btn primary" onClick={() => send(input)} style={{ fontSize: 14 }}>Send</button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default Assistant


