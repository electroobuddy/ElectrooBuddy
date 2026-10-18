import type { QueryableDatabase } from '../config/database.js';

export interface ProductListQuery {
  page: number;
  limit: number;
  category?: string | undefined;
  brand?: string | undefined;
  search?: string | undefined;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';
  featured?: boolean | undefined;
}

export interface CatalogRepository {
  listProducts(input: ProductListQuery): Promise<{ rows: Record<string, unknown>[]; total: number }>;
  findProductBySlug(slug: string): Promise<Record<string, unknown> | null>;
  listCategories(): Promise<Record<string, unknown>[]>;
  listServices(): Promise<Record<string, unknown>[]>;
  listOffers(visibility?: string): Promise<Record<string, unknown>[]>;
  listProjects(limit: number): Promise<Record<string, unknown>[]>;
  listTestimonials(limit: number): Promise<Record<string, unknown>[]>;
  listTeam(): Promise<Record<string, unknown>[]>;
  listPublicSiteSettings(keys: string[]): Promise<Array<{ key: string; value: string }>>;
}

const PRODUCT_PUBLIC_COLUMNS = `
  id, name, slug, description, short_description, price, compare_at_price,
  main_image_url, gallery_images, category, subcategory, brand, tags, specifications,
  is_active, is_featured, is_bestseller, track_inventory, inventory_quantity, allow_backorder,
  installation_available, installation_charge, installation_description,
  weight, weight_unit, length, width, height, dimension_unit,
  sku, meta_title, meta_description, sort_order, created_at, updated_at
`;

export function createCatalogRepository(db: QueryableDatabase): CatalogRepository {
  return {
    async listProducts(input) {
      const where = [`is_active = true`, `deleted_at IS NULL`];
      const values: unknown[] = [];
      const push = (value: unknown) => { values.push(value); return `$${values.length}`; };

      if (input.category && input.category !== 'all') where.push(`category = ${push(input.category)}`);
      if (input.brand && input.brand !== 'all') where.push(`brand = ${push(input.brand)}`);
      if (input.featured !== undefined) where.push(`is_featured = ${push(input.featured)}`);
      if (input.search) {
        const p = push(`%${input.search}%`);
        where.push(`(name ILIKE ${p} OR COALESCE(short_description, '') ILIKE ${p} OR COALESCE(brand, '') ILIKE ${p})`);
      }

      const orderBy = input.sort === 'price-asc' ? 'price ASC, id ASC'
        : input.sort === 'price-desc' ? 'price DESC, id ASC'
        : input.sort === 'name' ? 'name ASC, id ASC'
        : input.sort === 'newest' ? 'created_at DESC, id ASC'
        : 'is_featured DESC, sort_order ASC, created_at DESC, id ASC';

      const offset = (input.page - 1) * input.limit;
      const limitParam = push(input.limit);
      const offsetParam = push(offset);
      const whereSql = where.join(' AND ');

      const [rowsResult, countResult] = await Promise.all([
        db.query<Record<string, unknown>>(`SELECT ${PRODUCT_PUBLIC_COLUMNS} FROM products WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limitParam} OFFSET ${offsetParam}`, values),
        db.query<{ total: string }>(`SELECT count(*)::text AS total FROM products WHERE ${whereSql}`, values.slice(0, -2))
      ]);
      return { rows: rowsResult.rows, total: Number(countResult.rows[0]?.total ?? 0) };
    },

    async findProductBySlug(slug) {
      const result = await db.query<Record<string, unknown>>(
        `SELECT ${PRODUCT_PUBLIC_COLUMNS} FROM products WHERE slug = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
        [slug]
      );
      return result.rows[0] ?? null;
    },

    async listCategories() {
      const result = await db.query<Record<string, unknown>>(`
        SELECT id, name, slug, description, parent_id, image_url, banner_image_url,
               icon_name, sort_order, is_featured, meta_title, meta_description, created_at, updated_at
        FROM product_categories
        WHERE is_active = true
        ORDER BY sort_order ASC, name ASC, id ASC
      `);
      return result.rows;
    },

    async listServices() {
      const result = await db.query<Record<string, unknown>>(`
        SELECT id, title, description, icon_name, image_url, service_charge,
               show_visit_charge, visit_charge_label, whatsapp_enabled, call_enabled,
               book_now_enabled, sort_order, created_at, updated_at
        FROM services
        ORDER BY sort_order ASC, title ASC, id ASC
      `);
      return result.rows;
    },

    async listOffers(visibility) {
      const values: unknown[] = [];
      let visibilityFilter = '';
      if (visibility) {
        values.push(visibility);
        visibilityFilter = `AND $1 = ANY(visibility)`;
      }
      const result = await db.query<Record<string, unknown>>(`
        SELECT id, title, subtitle, description, banner_url, type, value, min_purchase,
               max_discount, start_date, end_date, expires_at, priority, visibility,
               cta_text, cta_link, bg_gradient, status, is_active, coupon_code,
               created_at, updated_at
        FROM offers
        WHERE is_active = true
          AND status = 'active'
          AND start_date <= now()
          AND (end_date IS NULL OR end_date > now())
          AND (expires_at IS NULL OR expires_at > now())
          ${visibilityFilter}
        ORDER BY priority DESC, created_at DESC, id ASC
      `, values);
      return result.rows;
    },

    async listProjects(limit) {
      const result = await db.query<Record<string, unknown>>(`
        SELECT id, title, description, category, image_url, created_at, updated_at
        FROM projects ORDER BY created_at DESC, id ASC LIMIT $1
      `, [limit]);
      return result.rows;
    },

    async listTestimonials(limit) {
      const result = await db.query<Record<string, unknown>>(`
        SELECT id, name, rating, text, service, image_url, created_at, updated_at
        FROM testimonials ORDER BY created_at DESC, id ASC LIMIT $1
      `, [limit]);
      return result.rows;
    },

    async listTeam() {
      const result = await db.query<Record<string, unknown>>(`
        SELECT id, name, role, bio, photo_url, sort_order, created_at, updated_at
        FROM team_members ORDER BY sort_order ASC, name ASC, id ASC
      `);
      return result.rows;
    },

    async listPublicSiteSettings(keys) {
      if (keys.length === 0) return [];
      const result = await db.query<{ key: string; value: string }>(
        `SELECT key, value FROM site_settings WHERE key = ANY($1::text[]) ORDER BY key ASC`,
        [keys]
      );
      return result.rows;
    }
  };
}
