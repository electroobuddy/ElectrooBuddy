import { Router } from 'express';
import type { CatalogController } from '../controllers/catalog.controller.js';

export function createCatalogRouter(controller: CatalogController) {
  const router = Router();
  router.get('/products', controller.listProducts);
  router.get('/products/:slug', controller.getProduct);
  router.get('/product-categories', controller.listCategories);
  router.get('/services', controller.listServices);
  router.get('/offers', controller.listOffers);
  router.get('/projects', controller.listProjects);
  router.get('/testimonials', controller.listTestimonials);
  router.get('/team-members', controller.listTeam);
  router.get('/site-settings', controller.listSiteSettings);
  return router;
}
