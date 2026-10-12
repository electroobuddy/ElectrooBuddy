/** Guest booking is intentionally unauthenticated; do not refresh a user session. */
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
export interface GuestBookingInput {
  requestId: string;
  serviceId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  exactLocation?: string | null;
  preferredDate: string;
  preferredTime: string;
  description?: string | null;
}
export interface GuestBookingResult {
  id: string;
  status: string;
  idempotent: boolean;
  tracking_token: string;
}
export async function createGuestBooking(input: GuestBookingInput): Promise<GuestBookingResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${BASE}/guest/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const envelope = await response.json().catch(() => null) as {
      success?: boolean; data?: GuestBookingResult; error?: { message?: string }
    } | null;
    if (!response.ok || !envelope?.success || !envelope.data?.tracking_token) {
      throw new Error(envelope?.error?.message || 'Booking could not be submitted. Please try again.');
    }
    return envelope.data;
  } finally { window.clearTimeout(timeout); }
}
