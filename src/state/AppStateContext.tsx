import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { v4 as uuid } from 'uuid'
import { AppState, Role, User, Vendor, PurchaseRequisition, RFQ, PurchaseOrder, Invoice, Asset, Settings, Quote } from './types'
import { loadState, saveState } from '../utils/storage'

type Action =
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_USER'; name: string }
  | { type: 'SET_NAV_COLLAPSED'; collapsed: boolean }
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_VENDOR'; vendor: Vendor }
  | { type: 'UPDATE_VENDOR'; vendor: Vendor }
  | { type: 'DELETE_VENDOR'; id: string }
  | { type: 'ADD_PR'; pr: PurchaseRequisition }
  | { type: 'UPDATE_PR'; pr: PurchaseRequisition }
  | { type: 'DELETE_PR'; id: string }
  | { type: 'ADD_RFQ'; rfq: RFQ }
  | { type: 'UPDATE_RFQ'; rfq: RFQ }
  | { type: 'DELETE_RFQ'; id: string }
  | { type: 'ADD_PO'; po: PurchaseOrder }
  | { type: 'UPDATE_PO'; po: PurchaseOrder }
  | { type: 'DELETE_PO'; id: string }
  | { type: 'ADD_INVOICE'; invoice: Invoice }
  | { type: 'UPDATE_INVOICE'; invoice: Invoice }
  | { type: 'ADD_ASSET'; asset: Asset }
  | { type: 'UPDATE_ASSET'; asset: Asset }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }

function initialSeed(): AppState {
  const seedUsers: User[] = [
    { id: uuid(), name: 'Alex Morgan', role: 'Admin' },
    { id: uuid(), name: 'Priya Singh', role: 'Procurement' },
    { id: uuid(), name: 'Rohan Mehta', role: 'Finance' },
    { id: uuid(), name: 'Jia Chen', role: 'Requestor', department: 'Engineering' }
  ]
  // Helpers for demo generation
  const now = Date.now()
  const categories: Vendor['category'][] = ['Software','Hardware','Services','Office Supplies','Other']
  const departments = ['HR','Finance','Product','UXD','Engineering','Admin','Security']
  const settingsDepartments = departments.map(name => ({ id: uuid(), name, hod: pick(['Alex Morgan','Priya Singh','Rohan Mehta','Jia Chen']) }))
  function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
  function money(n: number) { return Math.round(n * 100) / 100 }
  function dateIn(days: number) { return new Date(now + days * 86400000).toISOString().slice(0,10) }

  // Vendors
  const vendorNames = [
    // Travel tech and hospitality ecosystem
    'Amadeus GDS','Sabre Corporation','Travelport','RateTiger Channel Manager','SiteMinder',
    'Oracle Hospitality (Opera PMS)','Duetto RMS','IDeaS Revenue Solutions','Stripe Payments',
    'Worldpay','Adyen','Expedia Partner Solutions','Booking.com Partner Hub','Airbnb for Hosts',
    'Google Hotel Ads','Skyscanner Ads','Hopper','TripAdvisor Ads','Hotelbeds','TBO Holidays',
    'OYO Partner','MakeMyTrip B2B','Cleartrip','Goibibo','AirAsia Partners','Lufthansa Group',
    'IndiGo Corporate','Vistara Corporate','Accor Hotels','Marriott International'
  ]
  const vendors: Vendor[] = vendorNames.map((name, idx) => ({
    id: uuid(),
    name,
    category: pick(categories),
    contactPerson: `Contact ${idx+1}`,
    email: `contact${idx+1}@${name.replace(/[^a-zA-Z]/g,'').toLowerCase()}.travel`,
    documents: [],
    status: 'Approved',
    rating: Math.floor(Math.random()*2)+4,
    risk: pick(['Low','Low','Medium'])
  }))

  // PRs
  const prs: PurchaseRequisition[] = Array.from({ length: 8 }).map((_, i) => {
    const items = Array.from({ length: Math.floor(Math.random()*2)+1 }).map(() => ({
      id: uuid(),
      description: pick([
        'GDS Segment Credits',
        'Channel Manager Subscription - 50 properties',
        'RMS Seats - Revenue Team',
        'PMS Integration Fees',
        'Payment Gateway MDR Settlement',
        'Hotel Image CDN Bandwidth',
        'Airline NDC API Usage',
        'Metasearch Click Budget'
      ]),
      category: pick(categories),
      quantity: Math.floor(Math.random()*3)+1,
      unitCost: money(Math.random()*1500 + 200)
    }))
    const expectedTotal = items.reduce((s, it) => s + it.quantity * it.unitCost, 0)
    const statuses: PurchaseRequisition['status'][] = ['Pending Dept Approval','Pending Procurement Approval','Approved']
    const status = pick(statuses)
    return {
      id: uuid(),
      requestedByUserId: pick(seedUsers).id,
      department: pick(departments),
      justification: pick([
        'Distribution expansion for EMEA',
        'Seasonal demand ramp-up for APAC',
        'New brand onboarding for PMS',
        'Payments compliance & acceptance',
        'Metasearch performance campaign'
      ]),
      budgetCode: `${pick(['DISTR','RMS','PMS','MKT','PAY'])}-2025-${100+i}`,
      currency: pick(['USD','EUR','INR','GBP','AED','SGD']),
      desiredDeliveryDate: dateIn(Math.floor(Math.random()*30)+7),
      expectedTotal: money(expectedTotal),
      items,
      status,
      approvals: [{ id: uuid(), approverRole: 'Procurement', status: status === 'Approved' ? 'Approved' : 'Pending' }],
      createdAt: new Date(now - i*86400000).toISOString()
    }
  })

  // RFQs (subset of PRs)
  const rfqs: RFQ[] = prs.slice(0, 5).map(pr => {
    const invitedVendorIds = vendors.slice(0, Math.floor(Math.random()*5)+3).map(v => v.id)
    const quotes: Quote[] = invitedVendorIds.slice(0, Math.floor(Math.random()*3)+1).map(vId => ({
      id: uuid(),
      vendorId: vId,
      price: money(pr.expectedTotal * (0.9 + Math.random()*0.2)),
      deliveryDays: Math.floor(Math.random()*14)+3,
      notes: pick(['Net 15','Net 30','Net 45'])
    }))
    return {
      id: uuid(),
      fromPRId: pr.id,
      invitedVendorIds,
      quotes,
      selectedQuoteId: quotes.length ? quotes[0].id : undefined,
      status: quotes.length ? 'Awarded' as RFQ['status'] : 'Open',
      createdAt: new Date().toISOString()
    }
  })

  // POs from RFQs and some direct from PRs
  const pos: PurchaseOrder[] = [
    ...rfqs.filter(r => r.selectedQuoteId).map(r => {
      const pr = prs.find(p => p.id === r.fromPRId)!
      const sel = r.quotes.find(q => q.id === r.selectedQuoteId)!
      return {
        id: uuid(),
        fromRFQId: r.id,
        fromPRId: pr.id,
        vendorId: sel.vendorId,
        items: pr.items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unitCost: i.unitCost })),
        total: money(pr.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)),
        status: pick(['Open','Delivered','Closed']) as PurchaseOrder['status'],
        deliveryConfirmed: Math.random() > 0.5,
        vendorAccepted: true,
        terms: pick(['Net 15','Net 30']),
        expectedDeliveryDate: pr.desiredDeliveryDate,
        createdAt: new Date().toISOString()
      }
    }),
    ...prs.slice(5,8).map(pr => ({
      id: uuid(),
      fromPRId: pr.id,
      vendorId: pick(vendors).id,
      items: pr.items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unitCost: i.unitCost })),
      total: money(pr.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)),
      status: 'Open' as PurchaseOrder['status'],
      deliveryConfirmed: false,
      vendorAccepted: false,
      terms: 'Net 30',
      expectedDeliveryDate: pr.desiredDeliveryDate,
      createdAt: new Date().toISOString()
    }))
  ]

  // Invoices (various statuses)
  const invoices: Invoice[] = pos.slice(0, 8).map((po, i) => {
    const amount = po.total
    const threeWayMatch = po.deliveryConfirmed && Math.random() > 0.2
    const status: Invoice['status'] = pick(['Submitted','Approved','Paid','Overdue'])
    return {
      id: uuid(),
      vendorId: po.vendorId,
      poId: po.id,
      amount,
      dueDate: dateIn(30 - i*2),
      status,
      threeWayMatch,
      createdAt: new Date().toISOString()
    }
  })

  // Assets
  const assets: Asset[] = Array.from({ length: 10 }).map((_, i) => ({
    id: uuid(),
    vendorId: pick(vendors).id,
    name: pick([
      'Channel Manager - 50 Properties',
      'PMS Integration - Opera',
      'RMS Seats - 5 Users',
      'GDS Segment Pack',
      'Metasearch Budget',
      'Payment Gateway Contract'
    ]),
    assignedTo: Math.random() > 0.5 ? pick(['Distribution Team','Revenue Team','Supply Ops','Finance']) : undefined,
    department: pick(departments),
    renewalDate: dateIn(10 + i*12),
    autoRenew: Math.random() > 0.4,
    contractUrl: ''
  }))

  const seed: AppState = {
    currentUser: seedUsers[0],
    users: seedUsers,
    vendors,
    prs,
    rfqs,
    pos,
    invoices,
    assets,
    settings: {
      banks: [],
      departments: settingsDepartments,
      workflow: { makerCheckerEnabled: true }
    },
    uiCollapsed: false,
    isAuthenticated: true
  }
  return loadState(seed)
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE': {
      const updated = { ...state.currentUser, role: action.role }
      return { ...state, currentUser: updated }
    }
    case 'SET_USER': {
      const existing = state.users.find(u => u.name === action.name)
      const user = existing ?? { id: uuid(), name: action.name, role: state.currentUser.role }
      return existing ? { ...state, currentUser: existing } : { ...state, users: [...state.users, user], currentUser: user }
    }
    case 'LOGIN':
      return { ...state, currentUser: action.user, isAuthenticated: true }
    case 'LOGOUT':
      return { ...state, isAuthenticated: false }
    case 'SET_NAV_COLLAPSED':
      return { ...state, uiCollapsed: action.collapsed }
    case 'ADD_VENDOR':
      return { ...state, vendors: [action.vendor, ...state.vendors] }
    case 'UPDATE_VENDOR':
      return { ...state, vendors: state.vendors.map(v => v.id === action.vendor.id ? action.vendor : v) }
    case 'DELETE_VENDOR':
      return { ...state, vendors: state.vendors.filter(v => v.id !== action.id) }
    case 'ADD_PR':
      return { ...state, prs: [action.pr, ...state.prs] }
    case 'UPDATE_PR':
      return { ...state, prs: state.prs.map(p => p.id === action.pr.id ? action.pr : p) }
    case 'DELETE_PR':
      return { ...state, prs: state.prs.filter(p => p.id !== action.id) }
    case 'ADD_RFQ':
      return { ...state, rfqs: [action.rfq, ...state.rfqs] }
    case 'UPDATE_RFQ':
      return { ...state, rfqs: state.rfqs.map(r => r.id === action.rfq.id ? action.rfq : r) }
    case 'DELETE_RFQ':
      return { ...state, rfqs: state.rfqs.filter(r => r.id !== action.id) }
    case 'ADD_PO':
      return { ...state, pos: [action.po, ...state.pos] }
    case 'UPDATE_PO':
      return { ...state, pos: state.pos.map(p => p.id === action.po.id ? action.po : p) }
    case 'DELETE_PO':
      return { ...state, pos: state.pos.filter(p => p.id !== action.id) }
    case 'ADD_INVOICE':
      return { ...state, invoices: [action.invoice, ...state.invoices] }
    case 'UPDATE_INVOICE':
      return { ...state, invoices: state.invoices.map(i => i.id === action.invoice.id ? action.invoice : i) }
    case 'ADD_ASSET':
      return { ...state, assets: [action.asset, ...state.assets] }
    case 'UPDATE_ASSET':
      return { ...state, assets: state.assets.map(a => a.id === action.asset.id ? action.asset : a) }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.settings }
    default:
      return state
  }
}

const AppStateCtx = createContext<{
  state: AppState
  addVendor: (v: Omit<Vendor, 'id' | 'status' | 'documents'> & { documents?: string[], status?: Vendor['status'] }) => void
  updateVendor: (v: Vendor) => void
  deleteVendor: (id: string) => void
  addPR: (p: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'status' | 'approvals'>) => void
  updatePR: (p: PurchaseRequisition) => void
  deletePR: (id: string) => void
  addRFQ: (r: Omit<RFQ, 'id' | 'createdAt' | 'status' | 'quotes'>) => void
  updateRFQ: (r: RFQ) => void
  deleteRFQ: (id: string) => void
  addPO: (p: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'deliveryConfirmed'>) => void
  updatePO: (p: PurchaseOrder) => void
  deletePO: (id: string) => void
  addInvoice: (i: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'threeWayMatch'>) => void
  updateInvoice: (i: Invoice) => void
  addAsset: (a: Omit<Asset, 'id'>) => Asset
  updateAsset: (a: Asset) => void
  updateSettings: (s: Settings) => void
  setRole: (r: Role) => void
  setUser: (u: Partial<User>) => void
  setNavCollapsed: (collapsed: boolean) => void
  login: (user: User) => void
  logout: () => void
}>({} as any)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialSeed)

  useEffect(() => {
    saveState(state)
  }, [state])

  // Lightweight migration: ensure default departments are present in settings for older saved states
  useEffect(() => {
    const defaultNames = ['HR','Finance','Product','UXD','Engineering','Admin','Security']
    const existing = (state.settings?.departments ?? []).map(d => d.name)
    const missing = defaultNames.filter(n => !existing.includes(n))
    if (missing.length) {
      const toAdd = missing.map(name => ({ id: uuid(), name, hod: 'TBD' }))
      dispatch({
        type: 'UPDATE_SETTINGS',
        settings: {
          ...(state.settings ?? { banks: [], departments: [], workflow: { makerCheckerEnabled: true } }),
          departments: [ ...(state.settings?.departments ?? []), ...toAdd ]
        }
      })
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const api = useMemo(() => ({
    state,
    setRole: (role: Role) => dispatch({ type: 'SET_ROLE', role }),
    setUser: (u: Partial<User>) => dispatch({ type: 'SET_USER', name: u.name ?? state.currentUser.name }),
    setNavCollapsed: (collapsed: boolean) => dispatch({ type: 'SET_NAV_COLLAPSED', collapsed }),
    login: (user: User) => dispatch({ type: 'LOGIN', user }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    addVendor: (v: Omit<Vendor, 'id' | 'status' | 'documents'> & { documents?: string[], status?: Vendor['status'] }) => {
      const vendor: Vendor = { id: uuid(), status: v.status ?? 'Pending Approval', documents: v.documents ?? [], ...v }
      dispatch({ type: 'ADD_VENDOR', vendor })
    },
    updateVendor: (vendor: Vendor) => dispatch({ type: 'UPDATE_VENDOR', vendor }),
    deleteVendor: (id: string) => dispatch({ type: 'DELETE_VENDOR', id }),
    addPR: (p: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'status' | 'approvals'>) => {
      const pr: PurchaseRequisition = {
        ...p,
        id: uuid(),
        createdAt: new Date().toISOString(),
        status: 'Pending Dept Approval',
        currency: (p as any).currency ?? 'USD',
        approvals: [{ id: uuid(), approverRole: 'Procurement', status: 'Pending' }]
      }
      dispatch({ type: 'ADD_PR', pr })
    },
    updatePR: (pr: PurchaseRequisition) => dispatch({ type: 'UPDATE_PR', pr }),
    deletePR: (id: string) => dispatch({ type: 'DELETE_PR', id }),
    addRFQ: (r: Omit<RFQ, 'id' | 'createdAt' | 'status' | 'quotes'>) => {
      const rfq: RFQ = { ...r, id: uuid(), createdAt: new Date().toISOString(), status: 'Open', quotes: [] }
      dispatch({ type: 'ADD_RFQ', rfq })
    },
    updateRFQ: (rfq: RFQ) => dispatch({ type: 'UPDATE_RFQ', rfq }),
    deleteRFQ: (id: string) => dispatch({ type: 'DELETE_RFQ', id }),
    addPO: (p: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status' | 'deliveryConfirmed'>) => {
      const po: PurchaseOrder = { ...p, id: uuid(), createdAt: new Date().toISOString(), status: 'Open', deliveryConfirmed: false }
      dispatch({ type: 'ADD_PO', po })
    },
    updatePO: (po: PurchaseOrder) => dispatch({ type: 'UPDATE_PO', po }),
    deletePO: (id: string) => dispatch({ type: 'DELETE_PO', id }),
    addInvoice: (i: Omit<Invoice, 'id' | 'createdAt' | 'status' | 'threeWayMatch'>) => {
      const threeWayMatch = (() => {
        const po = state.pos.find(p => p.id === i.poId)
        return !!po && po.deliveryConfirmed && Math.abs((po.total ?? 0) - i.amount) < 0.01
      })()
      const invoice: Invoice = { ...i, id: uuid(), createdAt: new Date().toISOString(), status: 'Submitted', threeWayMatch }
      dispatch({ type: 'ADD_INVOICE', invoice })
    },
    updateInvoice: (invoice: Invoice) => dispatch({ type: 'UPDATE_INVOICE', invoice }),
    addAsset: (a: Omit<Asset, 'id'>): Asset => {
      const asset: Asset = { ...a, id: uuid() }
      dispatch({ type: 'ADD_ASSET', asset })
      return asset
    },
    updateAsset: (asset: Asset) => dispatch({ type: 'UPDATE_ASSET', asset }),
    updateSettings: (settings: Settings) => dispatch({ type: 'UPDATE_SETTINGS', settings })
  }), [state])

  return (
    <AppStateCtx.Provider value={api}>
      {children}
    </AppStateCtx.Provider>
  )
}

export function useAppState() {
  return useContext(AppStateCtx)
}


