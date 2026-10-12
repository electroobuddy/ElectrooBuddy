import type { CatalogRepository, ProductListQuery } from '../repositories/catalog.repository.js';
import { AppError } from '../errors/app-error.js';

const MONEY_FIELDS = new Set(['price','compare_at_price','installation_charge','service_charge','value','min_purchase','max_discount']);
const DECIMAL_FIELDS = new Set(['weight','length','width','height']);

function normalizeRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  for (const key of [...MONEY_FIELDS, ...DECIMAL_FIELDS]) {
    const value = out[key];
    if (typeof value === 'string' && value !== '') out[key] = Number(value);
  }
  return out;
}

export class CatalogService {
  constructor(private readonly repository: CatalogRepository, private readonly publicSettingKeys: readonly string[]) {}

  async listProducts(input: ProductListQuery) {
    const result = await this.repository.listProducts(input);
    return { items: result.rows.map(normalizeRow), total: result.total };
  }

  async getProductBySlug(slug: string) {
    const row = await this.repository.findProductBySlug(slug);
    if (!row) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    return normalizeRow(row);
  }

  async listCategories() { return (await this.repository.listCategories()).map(normalizeRow); }
  async listServices() { return (await this.repository.listServices()).map(normalizeRow); }

  async listOffers(visibility?: string) {
    return (await this.repository.listOffers(visibility)).map((row) => {
      const normalized = normalizeRow(row);
      return {
        ...normalized,
        // Compatibility aliases only; canonical DB names remain banner_url/cta_link/priority.
        image_url: normalized.banner_url ?? null,
        link_url: normalized.cta_link ?? null,
        sort_order: normalized.priority ?? 0
      };
    });
  }

  async listProjects(limit: number) { return (await this.repository.listProjects(limit)).map(normalizeRow); }
  async listTestimonials(limit: number) { return (await this.repository.listTestimonials(limit)).map(normalizeRow); }

  async listTeam() {
    return (await this.repository.listTeam()).map((row) => ({
      ...row,
      image_url: row.photo_url ?? null,
      social_links: null,
      is_active: true
    }));
  }

  async listSiteSettings(requestedKeys?: string[]) {
    const allowed = new Set(this.publicSettingKeys);
    const keys = requestedKeys?.length ? requestedKeys.filter((key) => allowed.has(key)) : [...allowed];
    const rows = await this.repository.listPublicSiteSettings(keys);
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }
}
