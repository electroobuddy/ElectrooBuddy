import { describe, expect, it } from 'vitest';
import { CatalogService } from '../src/services/catalog.service.js';
import type { CatalogRepository } from '../src/repositories/catalog.repository.js';

function repository(overrides: Partial<CatalogRepository> = {}): CatalogRepository {
  return {
    async listProducts() { return { rows: [{ id: '1', name: 'Fan', price: '999.50', installation_charge: '100.00' }], total: 1 }; },
    async findProductBySlug() { return { id: '1', name: 'Fan', price: '999.50' }; },
    async listCategories() { return []; },
    async listServices() { return [{ id: '1', title: 'Repair', service_charge: '150.00' }]; },
    async listOffers() { return [{ id: '1', banner_url: '/banner.webp', cta_link: '/booking', priority: 7, value: '10.00' }]; },
    async listProjects() { return []; },
    async listTestimonials() { return []; },
    async listTeam() { return [{ id: '1', name: 'A', photo_url: '/a.webp' }]; },
    async listPublicSiteSettings(keys) { return keys.map((key) => ({ key, value: `value:${key}` })); },
    ...overrides
  };
}

describe('Phase 4 catalog service', () => {
  it('normalizes PostgreSQL numeric strings for public JSON', async () => {
    const service = new CatalogService(repository(), ['phone_number']);
    const result = await service.listProducts({ page: 1, limit: 12, sort: 'featured' });
    expect(result.items[0]).toMatchObject({ price: 999.5, installation_charge: 100 });
  });

  it('normalizes historical offer/team aliases at API boundary', async () => {
    const service = new CatalogService(repository(), ['phone_number']);
    await expect(service.listOffers()).resolves.toEqual([expect.objectContaining({ image_url: '/banner.webp', link_url: '/booking', sort_order: 7, value: 10 })]);
    await expect(service.listTeam()).resolves.toEqual([expect.objectContaining({ image_url: '/a.webp', is_active: true })]);
  });

  it('never returns non-allowlisted site settings', async () => {
    const service = new CatalogService(repository(), ['phone_number']);
    await expect(service.listSiteSettings(['phone_number','provider_password'])).resolves.toEqual({ phone_number: 'value:phone_number' });
  });
});
