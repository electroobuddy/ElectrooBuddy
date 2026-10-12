-- Retain null user_id for genuine guest requests; scope retries to the contact phone.
-- The request UUID must be client-generated and reused for retries.
CREATE UNIQUE INDEX IF NOT EXISTS uq_guest_booking_phone_request
  ON bookings(phone, booking_request_id)
  WHERE user_id IS NULL AND booking_request_id IS NOT NULL;
