function Help() {
  const faqs: { q: string, a: JSX.Element }[] = [
    {
      q: 'How do I add a vendor?',
      a: (
        <ol>
          <li>Go to Vendors.</li>
          <li>Click Add Vendor (top right).</li>
          <li>Fill basic details, category, contact, compliance info.</li>
          <li>Submit to route for approval.</li>
        </ol>
      )
    },
    {
      q: 'How do I raise a Purchase Requisition (PR)?',
      a: (
        <ol>
          <li>Open Purchase Requisitions.</li>
          <li>Click Add PR and provide department, budget code, and justification.</li>
          <li>Add items (description, category, quantity, unit cost).</li>
          <li>Submit for approvals (department, then procurement).</li>
        </ol>
      )
    },
    {
      q: 'How do I create an RFQ from a PR?',
      a: (
        <ol>
          <li>On the PRs tab, use PR → RFQ or open RFQs tab and click Create RFQ.</li>
          <li>Select the PR and choose vendors to invite.</li>
          <li>Collect quotes, then award the best one.</li>
        </ol>
      )
    },
    {
      q: 'How do I create a Purchase Order (PO)?',
      a: (
        <ol>
          <li>Award an RFQ to generate a PO or convert a PR directly to a PO.</li>
          <li>Vendor accepts terms and expected delivery date.</li>
          <li>Confirm delivery (GRN) once received.</li>
        </ol>
      )
    },
    {
      q: 'How do I submit an Invoice and process payment?',
      a: (
        <ol>
          <li>Go to Invoices and submit against a PO.</li>
          <li>3-way match is performed (PO, GRN, Invoice).</li>
          <li>Approve then mark Paid as per payment terms.</li>
        </ol>
      )
    },
    {
      q: 'How do I add or manage Assets (licenses, subscriptions)?',
      a: (
        <ol>
          <li>Open Assets and click Add Asset.</li>
          <li>Provide vendor, name, department, assigned user, and renewal date.</li>
          <li>Use Edit to re-allocate department/assignee later.</li>
        </ol>
      )
    }
  ]

  return (
    <div className="grid cols-1">
      <div className="section-title">
        <h3>Help & FAQs</h3>
      </div>
      <div className="card">
        <div className="grid cols-1">
          {faqs.map((f, idx) => (
            <details key={idx} className="elevated" style={{ padding: 12 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{f.q}</summary>
              <div style={{ marginTop: 8 }}>
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Help


