const sz = 18
const stroke = 'var(--brand-600)'
const fill = 'var(--brand-50)'

export function IconDashboard() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" fill={fill} stroke={stroke}/>
      <rect x="13" y="3" width="8" height="5" rx="2" fill={fill} stroke={stroke}/>
      <rect x="13" y="10" width="8" height="11" rx="2" fill={fill} stroke={stroke}/>
      <rect x="3" y="13" width="8" height="8" rx="2" fill={fill} stroke={stroke}/>
    </svg>
  )
}
export function IconVendors() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill={fill} stroke={stroke}/>
      <path d="M2 20c0-3.314 2.686-6 6-6" fill="none" stroke={stroke}/>
      <circle cx="17" cy="7" r="3" fill={fill} stroke={stroke}/>
      <path d="M11 20c0-3 2.239-5 5-5" fill="none" stroke={stroke}/>
    </svg>
  )
}
export function IconPRs() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" fill={fill} stroke={stroke}/>
      <path d="M8 7h8M8 11h8M8 15h6" stroke={stroke}/>
    </svg>
  )
}
export function IconRFQs() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="14" height="16" rx="2" fill={fill} stroke={stroke}/>
      <circle cx="17.5" cy="17.5" r="3.5" fill={fill} stroke={stroke}/>
      <path d="M20 20l2 2" stroke={stroke}/>
    </svg>
  )
}
export function IconPOs() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill={fill} stroke={stroke}/>
      <path d="M3 7l3-4h12l3 4" fill={fill} stroke={stroke}/>
      <path d="M7 13h5M7 17h8" stroke={stroke}/>
    </svg>
  )
}
export function IconInvoices() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h10l4 4v14H6z" fill={fill} stroke={stroke}/>
      <path d="M16 3v5h5" fill="none" stroke={stroke}/>
      <path d="M8 12h8M8 16h6" stroke={stroke}/>
    </svg>
  )
}
export function IconRenewals() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6v6l4 2" fill="none" stroke={stroke}/>
      <circle cx="12" cy="12" r="9" fill="none" stroke={stroke}/>
    </svg>
  )
}
export function IconAssets() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="7" width="18" height="12" rx="2" fill={fill} stroke={stroke}/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke={stroke}/>
      <path d="M3 11h18" stroke={stroke}/>
    </svg>
  )
}
export function IconAnalytics() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V8M10 20V4M16 20v-6M22 20V10" stroke={stroke}/>
    </svg>
  )
}
export function IconAdmin() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="3" fill={fill} stroke={stroke}/>
      <path d="M5 21a7 7 0 0 1 14 0" fill="none" stroke={stroke}/>
    </svg>
  )
}

export function IconTrash() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" stroke="currentColor"/>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor"/>
      <rect x="5" y="6" width="14" height="16" rx="2" fill="none" stroke="currentColor"/>
      <path d="M10 10v8M14 10v8" stroke="currentColor"/>
    </svg>
  )
}

export function IconHelp() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke}/>
      <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 1.2-1.5 1.2-1.5 2.5" fill="none" stroke={stroke}/>
      <circle cx="12" cy="17" r="1" fill={stroke}/>
    </svg>
  )
}

export function IconSettings() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill={fill} stroke={stroke}/>
      <path d="M4 12h2M18 12h2M12 4v2M12 18v2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6" fill="none" stroke={stroke}/>
    </svg>
  )
}

export function IconChat() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="3" fill={fill} stroke={stroke}/>
      <path d="M8 20l4-4" stroke={stroke}/>
      <circle cx="9" cy="11" r="1" fill={stroke}/>
      <circle cx="12" cy="11" r="1" fill={stroke}/>
      <circle cx="15" cy="11" r="1" fill={stroke}/>
    </svg>
  )
}

export function IconDownload() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v10" stroke={stroke}/>
      <path d="M8 11l4 4 4-4" fill="none" stroke={stroke}/>
      <rect x="4" y="18" width="16" height="3" rx="1.5" fill={fill} stroke={stroke}/>
    </svg>
  )
}

export function IconMail() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill={fill} stroke={stroke}/>
      <path d="M4 7l8 6 8-6" fill="none" stroke={stroke}/>
    </svg>
  )
}

export function IconChevronLeft() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 6l-6 6 6 6" fill="none" stroke={stroke}/>
    </svg>
  )
}
export function IconChevronRight() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 6l6 6-6 6" fill="none" stroke={stroke}/>
    </svg>
  )
}


