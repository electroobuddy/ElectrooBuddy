import {Router} from 'express';
import type {AppEnv} from '../config/env.js';
import type {AuthRepository} from '../repositories/auth.repository.js';
import type {ShippingController} from '../controllers/shipping.controller.js';
import {authenticate,requirePermission,requireRole} from '../middleware/auth.js';
export function createShippingRouter(env:AppEnv,c:ShippingController,a:AuthRepository){
 const r=Router(),auth=authenticate(env,a),admin=[auth,requireRole('admin'),requirePermission('admin:write')] as const;
 r.get('/admin/shipping/settings',auth,requireRole('admin'),requirePermission('admin:read'),c.getSettings);
 r.put('/admin/shipping/settings',...admin,c.saveSettings);r.post('/admin/shipping/test',...admin,c.test);
 r.get('/admin/fulfillment/operations',auth,requireRole('admin'),requirePermission('admin:read'),c.operations);
 r.post('/admin/fulfillment/process',...admin,c.process);
 r.post('/admin/orders/:id/shipment',...admin,c.create);r.post('/admin/orders/:id/shipment/cancel',...admin,c.cancel);r.post('/admin/orders/:id/shipment/sync',...admin,c.sync);r.post('/admin/orders/:id/shipment/documents',...admin,c.documents);r.post('/admin/orders/:id/shipment/retry',...admin,c.retryOrder);
 r.post('/admin/returns/:id/replacement-shipment',...admin,c.createReplacement);r.post('/admin/returns/:id/replacement-shipment/retry',...admin,c.retryReplacement);r.post('/admin/returns/:id/replacement-shipment/documents',...admin,c.replacementDocuments);
 return r;
}
