type MapKey = 'PRs' | 'RFQs' | 'POs' | 'GRN' | 'RBAC'
const meanings: Record<MapKey, string> = {
  'PRs': 'Purchase Requisitions',
  'RFQs': 'Requests for Quotation',
  'POs': 'Purchase Orders',
  'GRN': 'Goods Receipt Note',
  'RBAC': 'Role-Based Access Control'
}

export function Acronym({ text }: { text: MapKey }) {
  return <abbr title={meanings[text]}>{text}</abbr>
}

export default Acronym


