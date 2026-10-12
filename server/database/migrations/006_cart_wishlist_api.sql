BEGIN;
CREATE INDEX IF NOT EXISTS idx_cart_items_user_updated ON cart_items(user_id, updated_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishlist_user_created ON wishlist(user_id, created_at DESC);
COMMIT;
