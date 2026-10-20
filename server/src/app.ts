import express from 'express';
import type { Logger } from 'pino';
import type { AppEnv } from './config/env.js';
import type { DatabaseClient } from './config/database.js';
import { SystemController } from './controllers/system.controller.js';
import { AuthController } from './controllers/auth.controller.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { httpLogger } from './middleware/http-logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { createCorsMiddleware, createGlobalRateLimiter, createHelmetMiddleware } from './middleware/security.js';
import { PostgresSystemRepository } from './repositories/system.repository.js';
import { AuthRepository } from './repositories/auth.repository.js';
import { createApiRouter } from './routes/index.js';
import { SystemService } from './services/system.service.js';
import { AuthService } from './services/auth.service.js';
import { createAuthDeliveryProvider } from './providers/auth-delivery.provider.js';
import { createCatalogRepository } from './repositories/catalog.repository.js';
import { CatalogService } from './services/catalog.service.js';
import { CatalogController } from './controllers/catalog.controller.js';
import { MediaController } from './controllers/media.controller.js';
import { MediaService } from './services/media.service.js';
import { createStorageProvider } from './providers/s3-storage.provider.js';
import { AccountRepository } from './repositories/account.repository.js';
import { AccountService } from './services/account.service.js';
import { AccountController } from './controllers/account.controller.js';
import { CartRepository } from './repositories/cart.repository.js';
import { CartService } from './services/cart.service.js';
import { CartController } from './controllers/cart.controller.js';
import { BookingRepository } from './repositories/booking.repository.js';
import { BookingService } from './services/booking.service.js';
import { BookingController } from './controllers/booking.controller.js';
import { TechnicianRepository } from './repositories/technician.repository.js';
import { TechnicianService } from './services/technician.service.js';
import { TechnicianController } from './controllers/technician.controller.js';
import { PricingRepository } from './repositories/pricing.repository.js';
import { PricingService } from './services/pricing.service.js';
import { PricingController } from './controllers/pricing.controller.js';
import { CheckoutService } from './services/checkout.service.js';
import { CheckoutController } from './controllers/checkout.controller.js';
import { RazorpayPaymentProvider } from './providers/razorpay-payment.provider.js';
import { PaymentService } from './services/payment.service.js';
import { PaymentController } from './controllers/payment.controller.js';
import { OrderService } from './services/order.service.js';
import { OrderController } from './controllers/order.controller.js';
import { RefundService } from './services/refund.service.js';
import { RefundController } from './controllers/refund.controller.js';
import { ReturnService } from './services/return.service.js';
import { ReturnController } from './controllers/return.controller.js';
import { ShippingService } from './services/shipping.service.js';
import { ShippingController } from './controllers/shipping.controller.js';
import { ShiprocketShippingProvider } from './providers/shiprocket-shipping.provider.js';
import { NotificationRepository } from './repositories/notification.repository.js';
import { NotificationService } from './services/notification.service.js';
import { NotificationController } from './controllers/notification.controller.js';
import { NativeNotificationDeliveryProvider } from './providers/notification-delivery.provider.js';
import { AdminOperationsRepository } from './repositories/admin-operations.repository.js';
import { AdminOperationsService } from './services/admin-operations.service.js';
import { AdminOperationsController } from './controllers/admin-operations.controller.js';
import { AdminCatalogRepository } from './repositories/admin-catalog.repository.js';
import { AdminCatalogService } from './services/admin-catalog.service.js';
import { AdminCatalogController } from './controllers/admin-catalog.controller.js';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { SubscriptionService } from './services/subscription.service.js';
import { SubscriptionController } from './controllers/subscription.controller.js';
import { OpsRepository } from './repositories/ops.repository.js';
import { OpsService } from './services/ops.service.js';
import { OpsController } from './controllers/ops.controller.js';

export interface AppDependencies {
  env: AppEnv;
  logger: Logger;
  database: DatabaseClient;
}

export function createApp({ env, logger, database }: AppDependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestIdMiddleware);
  app.use(httpLogger(logger));
  app.use(createHelmetMiddleware());
  app.use(createCorsMiddleware(env));
  app.use(createGlobalRateLimiter(env));

  const paymentProvider = new RazorpayPaymentProvider(env);
  const paymentService = new PaymentService(env, database, paymentProvider);
  const paymentController = new PaymentController(paymentService);
  const orderService = new OrderService(database);
  const orderController = new OrderController(orderService);
  const refundService = new RefundService(database, paymentProvider);
  const refundController = new RefundController(refundService);
  const returnService = new ReturnService(database, refundService);
  const returnController = new ReturnController(returnService);
  const shippingProvider = new ShiprocketShippingProvider(env);
  const shippingService = new ShippingService(env, database, shippingProvider);
  const shippingController = new ShippingController(shippingService);
  const notificationRepository = new NotificationRepository(database);
  const notificationDelivery = new NativeNotificationDeliveryProvider(env);
  const notificationService = new NotificationService(notificationRepository, notificationDelivery);
  const notificationController = new NotificationController(notificationService);
  const adminOperationsRepository = new AdminOperationsRepository(database);
  const adminOperationsService = new AdminOperationsService(adminOperationsRepository);
  const adminOperationsController = new AdminOperationsController(adminOperationsService);
  const adminCatalogRepository = new AdminCatalogRepository(database);
  const adminCatalogService = new AdminCatalogService(adminCatalogRepository);
  const adminCatalogController = new AdminCatalogController(adminCatalogService);
  const subscriptionRepository = new SubscriptionRepository(database);
  const subscriptionService = new SubscriptionService(env, database, subscriptionRepository, paymentProvider);
  const subscriptionController = new SubscriptionController(subscriptionService);
  const opsController = new OpsController(new OpsService(env, new OpsRepository(database)));
  app.post(`${env.API_PREFIX}/webhooks/fulfillment`, express.raw({ type: 'application/json', limit: '1mb' }), shippingController.webhook);
  app.post(`${env.API_PREFIX}/webhooks/razorpay`, express.raw({ type: 'application/json', limit: '1mb' }), (req,res,next)=>{
    try { const body=Buffer.isBuffer(req.body)?JSON.parse(req.body.toString('utf8')):null; if(String(body?.event??'').startsWith('refund.')) return refundController.webhook(req,res,next); } catch {}
    return paymentController.webhook(req,res,next);
  });

  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }));

  const systemRepository = new PostgresSystemRepository(database);
  const systemService = new SystemService(systemRepository);
  const systemController = new SystemController(systemService);

  const authRepository = new AuthRepository(database);
  const authDelivery = createAuthDeliveryProvider(env, (data, message) => logger.warn(data, message));
  const authService = new AuthService(env, database, authRepository, authDelivery);
  const authController = new AuthController(env, authService);

  const catalogRepository = createCatalogRepository(database);
  const catalogService = new CatalogService(catalogRepository, env.publicSiteSettingKeys);
  const catalogController = new CatalogController(catalogService);

  const accountRepository = new AccountRepository(database);
  const accountService = new AccountService(accountRepository);
  const accountController = new AccountController(accountService);

  const cartRepository = new CartRepository(database);
  const cartService = new CartService(cartRepository);
  const cartController = new CartController(cartService);

  const bookingRepository = new BookingRepository(database);
  const bookingService = new BookingService(env, database, bookingRepository);
  const bookingController = new BookingController(bookingService);

  const technicianRepository = new TechnicianRepository(database);
  const technicianService = new TechnicianService(technicianRepository);
  const technicianController = new TechnicianController(technicianService);

  const pricingRepository = new PricingRepository(database);
  const pricingService = new PricingService(pricingRepository);
  const pricingController = new PricingController(pricingService);

  const checkoutService = new CheckoutService(env, database, paymentProvider);
  const checkoutController = new CheckoutController(checkoutService);

  const storageProvider = createStorageProvider(env);
  const mediaService = new MediaService(database, storageProvider, env.STORAGE_MAX_IMAGE_BYTES);
  const mediaController = new MediaController(mediaService);

  app.use(env.API_PREFIX, createApiRouter({ env, systemController, authController, authRepository, catalogController, mediaController, accountController, cartController, bookingController, technicianController, pricingController, checkoutController, paymentController, orderController, refundController, returnController, shippingController, notificationController, adminOperationsController, adminCatalogController, subscriptionController, opsController }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
