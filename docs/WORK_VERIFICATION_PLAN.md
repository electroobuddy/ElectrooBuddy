
# Work Verification & Invoice Access Control Plan

## Problems Identified

1. **Invoice access**: Any role can download the invoice at any time, even before work starts. This devalues the invoice as a completion document.

2. **No work verification**: Marking a booking "completed" is a single button click with zero proof. Anyone could fraudulently mark work done without actually performing the service.

---

## ✅ Phase 1 — Restrict Invoice Access (completed)

| Role | Can download invoice when |
|------|--------------------------|
| Admin | Always (full control) |
| Technician | Only when `status === "completed"` |
| User | Only when `status === "completed"` |

**Implemented in**: `src/pages/BookingDetails.tsx:352-360`

---

## Phase 2 — OTP Work Verification

### Flow

```
Technician clicks "Start Work"
  → Status changes to "in_progress"

Technician finishes work, clicks "Mark Complete"
  → System generates a 6-digit OTP
  → OTP sent to customer via Firebase FCM notification
  → OTP + expiry stored in booking row (customer_otp, otp_expires_at)
  → Modal appears asking technician to enter the OTP
  → Technician reads OTP from customer's phone and enters it
  → If valid & not expired → status changes to "completed"
  → If invalid/expired → error toast, no status change

After completion
  → Invoice becomes downloadable for technician & user
```

### OTP Details

- **Length**: 6 digits, numeric
- **Expiry**: 5 minutes from generation
- **Generation**: `Math.floor(100000 + Math.random() * 900000).toString()`
- **Storage**: New columns on `bookings` table:
  - `customer_otp` (TEXT, nullable)
  - `otp_expires_at` (TIMESTAMPTZ, nullable)
  - `otp_verified_at` (TIMESTAMPTZ, nullable)
  - `fcm_token` (TEXT, nullable) — customer's Firebase device token

### Firebase FCM Notification Payload

Sent via a `send-otp` Edge Function:

```json
{
  "to": "<customer-fcm-token>",
  "notification": {
    "title": "Work Completion OTP",
    "body": "Your technician has completed the work. Share this OTP: {otp}"
  },
  "data": {
    "type": "otp",
    "bookingId": "<booking_id>",
    "otp": "<6-digit-otp>"
  }
}
```

**Note**: Requires storing the customer's FCM token. If unavailable, fallback to showing OTP in admin panel.

---

## Phase 3 — Supabase Schema Changes

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_otp TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fcm_token TEXT;
```

---

## Phase 4 — Implementation Order

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 1 | ✅ Restrict invoice to completed | Done | |
| 2 | OTP generation + storage | 1 hr | On Mark Complete click |
| 3 | Store FCM token per customer | 1 hr | On login / booking creation |
| 4 | Send OTP via Firebase FCM | 2-3 hrs | Edge Function using existing FCM setup |
| 5 | OTP input modal + verification | 2 hrs | Frontend modal + validation |
