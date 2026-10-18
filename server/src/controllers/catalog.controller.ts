import { omitUndefined } from '../utils/omit-undefined.js';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { CatalogService } from '../services/catalog.service.js';

const productListSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['featured','newest','price-asc','price-desc','name']).default('featured'),
  featured: z.enum(['true','false']).transform((v) => v === 'true').optional()
});
const slugSchema = z.object({ slug: z.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/) });
const listLimitSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });
const offerSchema = z.object({ visibility: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/).optional() });
const settingsSchema = z.object({ keys: z.string().trim().max(1000).optional() });

export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  listProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = productListSchema.parse(req.query);
      const result = await this.service.listProducts(omitUndefined(q));
      res.json({ success: true, data: result.items, meta: { page: q.page, limit: q.limit, total: result.total, pages: Math.ceil(result.total / q.limit) } });
    } catch (error) { next(error); }
  };

  getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try { const { slug } = slugSchema.parse(req.params); res.json({ success: true, data: await this.service.getProductBySlug(slug) }); }
    catch (error) { next(error); }
  };

  listCategories = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await this.service.listCategories() }); } catch (e) { next(e); } };
  listServices = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await this.service.listServices() }); } catch (e) { next(e); } };
  listOffers = async (req: Request, res: Response, next: NextFunction) => { try { const q=offerSchema.parse(req.query); res.json({ success:true,data:await this.service.listOffers(q.visibility) }); } catch(e){ next(e);} };
  listProjects = async (req: Request, res: Response, next: NextFunction) => { try { const q=listLimitSchema.parse(req.query); res.json({ success:true,data:await this.service.listProjects(q.limit) }); } catch(e){ next(e);} };
  listTestimonials = async (req: Request, res: Response, next: NextFunction) => { try { const q=listLimitSchema.parse(req.query); res.json({ success:true,data:await this.service.listTestimonials(q.limit) }); } catch(e){ next(e);} };
  listTeam = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ success:true,data:await this.service.listTeam() }); } catch(e){ next(e);} };
  listSiteSettings = async (req: Request, res: Response, next: NextFunction) => { try { const q=settingsSchema.parse(req.query); const keys=q.keys?.split(',').map(k=>k.trim()).filter(Boolean); res.json({success:true,data:await this.service.listSiteSettings(keys)}); } catch(e){ next(e);} };
}
