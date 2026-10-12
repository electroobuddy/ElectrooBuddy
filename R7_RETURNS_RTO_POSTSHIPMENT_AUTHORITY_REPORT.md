# R7 — Returns / RTO & Post-Shipment Financial Authority

Implemented:
- Item/quantity-level return records and immutable order-item linkage.
- 7-day delivered-order eligibility enforced server-side.
- Duplicate/over-return quantity prevention across active return requests.
- Customer return vs replacement resolution selection.
- Admin physical receipt/inspection authority.
- Inventory is increased only by accepted physical quantity during inspection; requesting/approving a return does not restock inventory.
- Per-item accepted/restocked counters make inspection idempotent and prevent double restock.
- Refund amount is derived from original order-item line economics, not customer input.
- Accepted refund returns flow into the existing R6 Razorpay refund ledger/provider authority.
- Replacement requests become replacement-authorized only after inspection.
- Shiprocket webhook recognizes RTO in-transit and RTO-received states and creates/synchronizes an RTO record without automatically refunding or restocking.
- Provider cancellation remains financially non-authoritative.
- Admin Returns/RTO worklist added at `/admin/returns`.
- Customer My Orders adds Return / Replace actions only inside the 7-day delivered window.

Important operational rule:
RTO/return arrival alone does NOT restock inventory. Operations must physically inspect and accept quantities first. Refund/replacement is then processed from the accepted quantity.

Deployment:
1. Apply `20260930_r7_returns_rto_postshipment_authority.sql`.
2. Deploy `process-return-resolution` and updated `shiprocket-webhook`.
3. Deploy frontend.
4. Add `/admin/returns` to admin navigation if your menu is data-driven outside App routes.
5. Test partial quantity return, duplicate return, expired window, replacement, rejected inspection, partial acceptance, double inspection, RTO in transit/received, duplicate webhook, return refund and refund reconciliation.

Build note:
Production build remains unverified because the archived dependency executable returns `vite: Permission denied`; no successful build is claimed.

Next recommended phase: R8 — Final Production Certification & Financial State-Machine Audit.
