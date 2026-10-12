-- Phase 16: native Shiprocket shipping / fulfillment authority.
ALTER TABLE fulfillment_jobs
  ADD COLUMN IF NOT EXISTS provider_attempt_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_phase16_fulfillment_claim ON fulfillment_jobs(status,next_attempt_at,locked_at);
CREATE INDEX IF NOT EXISTS idx_phase16_orders_shiprocket_shipment ON orders(shiprocket_shipment_id) WHERE shiprocket_shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phase16_orders_fulfillment_tracking ON orders(fulfillment_status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_phase16_fulfillment_events_provider_status ON fulfillment_events(provider,provider_status,received_at DESC);

-- Credentials stay in server environment variables. This table stores only non-secret runtime preferences.
INSERT INTO shipping_settings(id,enabled,auto_create_shipment,webhook_url,default_weight,default_length,default_width,default_height)
VALUES(1,false,true,NULL,1,10,10,10)
ON CONFLICT (id) DO NOTHING;
