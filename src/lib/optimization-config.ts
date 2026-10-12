/**
 * Production Optimization Configuration
 * 
 * This file contains all optimization settings for production deployment
 */

// Cache durations in milliseconds
export const CACHE_CONFIG = {
  // Static data (rarely changes)
  SERVICES: 1000 * 60 * 60 * 24, // 24 hours
  TEAM_MEMBERS: 1000 * 60 * 60 * 24, // 24 hours
  TESTIMONIALS: 1000 * 60 * 60 * 12, // 12 hours
  PROJECTS: 1000 * 60 * 60 * 12, // 12 hours
  
  // Dynamic data (changes frequently)
  PRODUCTS: 1000 * 60 * 30, // 30 minutes
  USER_PROFILE: 1000 * 60 * 5, // 5 minutes
  CART: 1000 * 60 * 2, // 2 minutes
  ORDERS: 1000 * 60 * 1, // 1 minute
  BOOKINGS: 1000 * 60 * 1, // 1 minute
  
  // Admin data (shorter cache for better accuracy)
  ADMIN_STATS: 1000 * 60 * 5, // 5 minutes
  ADMIN_DASHBOARD: 1000 * 60 * 2, // 2 minutes
  ADMIN_PRODUCTS: 1000 * 60 * 3, // 3 minutes
  ADMIN_USERS: 1000 * 60 * 3, // 3 minutes
  ADMIN_SERVICES: 1000 * 60 * 5, // 5 minutes
  ADMIN_MESSAGES: 1000 * 60 * 1, // 1 minute
  ADMIN_BOOKINGS: 1000 * 60 * 1, // 1 minute
  ADMIN_ORDERS: 1000 * 60 * 1, // 1 minute
  
  // Very dynamic (real-time)
  INVENTORY: 1000 * 30, // 30 seconds
};

// Pagination settings
export const PAGINATION = {
  PRODUCTS_PER_PAGE: 12,
  ORDERS_PER_PAGE: 10,
  BOOKINGS_PER_PAGE: 10,
  MESSAGES_PER_PAGE: 20,
};

// Image optimization
export const IMAGE_CONFIG = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  QUALITY: 80,
  FORMAT: 'webp',
  THUMBNAIL_WIDTH: 400,
  THUMBNAIL_HEIGHT: 400,
};

// Lazy loading thresholds
export const LAZY_LOAD_CONFIG = {
  ROOT_MARGIN: '200px',
  THRESHOLD: 0.01,
};

// API rate limiting (client-side)
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Bundle optimization
export const BUNDLE_CONFIG = {
  CHUNK_SIZE_WARNING: 50000, // 50KB
  MAX_CHUNK_SIZE: 100000, // 100KB
};
