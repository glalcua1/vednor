RateGain | Vendor Management
=================================

Internal Vendor Management System (VMS) built with React + Vite + TypeScript.

Getting Started
---------------
1) Install dependencies:
   - npm install
2) Run the dev server:
   - npm run dev
3) Open the app:
   - http://localhost:5173

Tech
----
- React 18, TypeScript, Vite
- React Router for navigation
- LocalStorage persistence for demo data
- Clean blue theme, left-hand navigation, responsive layout

Key Modules
-----------
- Vendor Onboarding and Vendor management
- Purchase Requisitions (PR)
- Request for Quotation (RFQ)
- Purchase Orders (PO)
- Invoices with 3-way match simulation (PO, GRN, Invoice)
- Renewals and asset tracking with reminders
- Analytics (spend, statuses, renewals)
- Admin (RBAC mock: Admin, Procurement, Finance, Requestor)

Notes
-----
- This implementation uses localStorage to persist data for demo purposes.
- Approvals are simplified; extend the reducer and pages to integrate with backends.
- Styles live in src/styles with CSS variables for blue tones and consistent spacing.


# vendor_management
