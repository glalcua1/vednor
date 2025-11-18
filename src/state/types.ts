export type Role = 'Admin' | 'Procurement' | 'Finance' | 'Requestor'

export interface User {
  id: string
  name: string
  role: Role
  department?: string
}

export type VendorStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Restricted'
export interface Vendor {
  id: string
  name: string
  category: 'Software' | 'Hardware' | 'Office Supplies' | 'Services' | 'Other'
  contactPerson: string
  email: string
  phone?: string
  bank?: string
  taxId?: string
  documents: string[]
  status: VendorStatus
  rating?: number
  risk?: 'Low' | 'Medium' | 'High'
  discount?: number
  contractUrl?: string
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected'
export interface Approval {
  id: string
  approverRole: Role
  status: ApprovalStatus
  comments?: string
  date?: string
}

export interface PRItem {
  id: string
  description: string
  category: Vendor['category']
  quantity: number
  unitCost: number
}
export type PRStatus = 'Draft' | 'Pending Dept Approval' | 'Pending Procurement Approval' | 'Approved' | 'Rejected' | 'Converted to RFQ' | 'Converted to PO'
export interface PurchaseRequisition {
  id: string
  requestedByUserId: string
  department: string
  justification: string
  budgetCode: string
  currency: string
  desiredDeliveryDate?: string
  expectedTotal: number
  items: PRItem[]
  status: PRStatus
  approvals: Approval[]
  createdAt: string
}

export interface Quote {
  id: string
  vendorId: string
  price: number
  deliveryDays: number
  notes?: string
  currency?: string
}
export type RFQStatus = 'Open' | 'Closed' | 'Awarded'
export interface RFQ {
  id: string
  fromPRId: string
  invitedVendorIds: string[]
  quotes: Quote[]
  selectedQuoteId?: string
  status: RFQStatus
  createdAt: string
}

export type POStatus = 'Open' | 'Delivered' | 'Closed'
export interface POItem {
  id: string
  description: string
  quantity: number
  unitCost: number
}
export interface PurchaseOrder {
  id: string
  fromRFQId?: string
  fromPRId?: string
  vendorId: string
  items: POItem[]
  total: number
  status: POStatus
  deliveryConfirmed: boolean
  vendorAccepted?: boolean
  terms?: string
  expectedDeliveryDate?: string
  createdAt: string
}

export type InvoiceStatus = 'Submitted' | 'Approved' | 'Paid' | 'Overdue'
export interface Invoice {
  id: string
  vendorId: string
  poId: string
  amount: number
  dueDate: string
  status: InvoiceStatus
  threeWayMatch: boolean
  createdAt: string
}

export interface Asset {
  id: string
  vendorId: string
  name: string
  assignedTo?: string
  department?: string
  renewalDate: string
  autoRenew: boolean
  contractUrl?: string
}

export interface BankDetails {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  ifscOrSwift?: string
  currency?: string
}
export interface DepartmentInfo {
  id: string
  name: string
  hod: string
  budgetCode?: string
}
export interface WorkflowSettings {
  makerCheckerEnabled: boolean
}
export interface Settings {
  banks: BankDetails[]
  departments: DepartmentInfo[]
  workflow: WorkflowSettings
}

export interface AppState {
  currentUser: User
  users: User[]
  vendors: Vendor[]
  prs: PurchaseRequisition[]
  rfqs: RFQ[]
  pos: PurchaseOrder[]
  invoices: Invoice[]
  assets: Asset[]
  settings?: Settings
  uiCollapsed?: boolean
  isAuthenticated?: boolean
}


