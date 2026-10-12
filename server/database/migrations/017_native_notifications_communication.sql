BEGIN;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS return_id uuid REFERENCES order_returns(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_pushed boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS pushed_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_event_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_source_event_key ON notifications(source_event_key) WHERE source_event_key IS NOT NULL;

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS order_updates boolean NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS payment_updates boolean NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS shipping_updates boolean NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS refund_updates boolean NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS return_updates boolean NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS booking_updates boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  return_id uuid REFERENCES order_returns(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_channels text[] NOT NULL DEFAULT ARRAY['in_app','email','push']::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','retry','sent','partial','failed','suppressed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  delivered_channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  suppressed_channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_claim
  ON notification_outbox(status, next_attempt_at, created_at)
  WHERE status IN ('pending','retry','processing');
CREATE INDEX IF NOT EXISTS idx_notification_outbox_user_created
  ON notification_outbox(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_order_created
  ON notifications(order_id, created_at DESC) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_return_created
  ON notifications(return_id, created_at DESC) WHERE return_id IS NOT NULL;

CREATE OR REPLACE FUNCTION enqueue_order_notification() RETURNS trigger AS $$
DECLARE
  v_event text;
  v_title text;
  v_message text;
  v_key text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'order.created';
    v_title := 'Order placed';
    v_message := 'Your order ' || NEW.order_number || ' has been placed.';
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    v_event := 'payment.' || NEW.payment_status;
    v_title := CASE WHEN NEW.payment_status = 'paid' THEN 'Payment received' ELSE 'Payment update' END;
    v_message := 'Payment status for order ' || NEW.order_number || ' is now ' || NEW.payment_status || '.';
  ELSIF NEW.fulfillment_status IS DISTINCT FROM OLD.fulfillment_status THEN
    v_event := 'shipping.' || NEW.fulfillment_status;
    v_title := CASE
      WHEN NEW.fulfillment_status = 'shipped' THEN 'Order shipped'
      WHEN NEW.fulfillment_status = 'out_for_delivery' THEN 'Out for delivery'
      WHEN NEW.fulfillment_status = 'delivered' THEN 'Order delivered'
      ELSE 'Shipping update' END;
    v_message := 'Shipping status for order ' || NEW.order_number || ' is now ' || NEW.fulfillment_status || '.';
  ELSIF NEW.refund_status IS DISTINCT FROM OLD.refund_status THEN
    v_event := 'refund.' || NEW.refund_status;
    v_title := 'Refund update';
    v_message := 'Refund status for order ' || NEW.order_number || ' is now ' || NEW.refund_status || '.';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_event := 'order.' || NEW.status;
    v_title := 'Order update';
    v_message := 'Order ' || NEW.order_number || ' is now ' || NEW.status || '.';
  ELSE
    RETURN NEW;
  END IF;

  v_key := 'order:' || NEW.id::text || ':' || v_event || ':' || COALESCE(NEW.updated_at::text, now()::text);
  INSERT INTO notification_outbox(user_id,event_key,event_type,title,message,order_id,metadata)
  VALUES(NEW.user_id,v_key,v_event,v_title,v_message,NEW.id,jsonb_build_object('order_number',NEW.order_number))
  ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_notification_outbox ON orders;
CREATE TRIGGER trg_order_notification_outbox
AFTER INSERT OR UPDATE OF status,payment_status,fulfillment_status,refund_status ON orders
FOR EACH ROW EXECUTE FUNCTION enqueue_order_notification();

CREATE OR REPLACE FUNCTION enqueue_return_notification() RETURNS trigger AS $$
DECLARE
  v_user uuid;
  v_order_number text;
  v_event text;
  v_key text;
BEGIN
  SELECT o.user_id,o.order_number INTO v_user,v_order_number FROM orders o WHERE o.id=NEW.order_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN v_event := 'return.requested';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN v_event := 'return.' || NEW.status;
  ELSE RETURN NEW; END IF;
  v_key := 'return:' || NEW.id::text || ':' || v_event || ':' || COALESCE(NEW.updated_at::text,now()::text);
  INSERT INTO notification_outbox(user_id,event_key,event_type,title,message,order_id,return_id,metadata)
  VALUES(v_user,v_key,v_event,'Return update','Return status for order '||v_order_number||' is now '||NEW.status||'.',NEW.order_id,NEW.id,jsonb_build_object('order_number',v_order_number))
  ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_return_notification_outbox ON order_returns;
CREATE TRIGGER trg_return_notification_outbox
AFTER INSERT OR UPDATE OF status ON order_returns
FOR EACH ROW EXECUTE FUNCTION enqueue_return_notification();

COMMIT;
