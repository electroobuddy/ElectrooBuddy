BEGIN;

-- Public catalog read-path indexes. Portable PostgreSQL only; no provider coupling.
CREATE INDEX IF NOT EXISTS idx_products_public_default
  ON products (is_featured DESC, sort_order ASC, created_at DESC, id)
  WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_public_category
  ON products (category, sort_order ASC, created_at DESC, id)
  WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_public_brand
  ON products (brand, sort_order ASC, created_at DESC, id)
  WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_public_price
  ON products (price, id)
  WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_categories_public
  ON product_categories (sort_order ASC, name ASC, id)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_public
  ON services (sort_order ASC, title ASC, id);
CREATE INDEX IF NOT EXISTS idx_offers_public_active
  ON offers (priority DESC, created_at DESC, id)
  WHERE is_active = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_projects_public_recent ON projects (created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_testimonials_public_recent ON testimonials (created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_team_members_public_order ON team_members (sort_order ASC, name ASC, id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings (key);

COMMIT;
