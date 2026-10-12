export const permissions = [
  'profile:read',
  'profile:write',
  'cart:read',
  'cart:write',
  'wishlist:read',
  'wishlist:write',
  'checkout:create',
  'orders:read-own',
  'bookings:read-own',
  'bookings:write',
  'technician:work',
  'admin:read',
  'admin:write',
  'admin:security'
] as const;

export type Permission = (typeof permissions)[number];
export type AppRole = 'user' | 'technician' | 'admin';

const rolePermissions: Record<AppRole, ReadonlySet<Permission>> = {
  user: new Set<Permission>(['profile:read', 'profile:write', 'cart:read', 'cart:write', 'wishlist:read', 'wishlist:write', 'checkout:create', 'orders:read-own', 'bookings:read-own', 'bookings:write']),
  technician: new Set<Permission>([
    'profile:read',
    'profile:write',
  'cart:read',
  'cart:write',
  'wishlist:read',
  'wishlist:write',
  'checkout:create',
    'orders:read-own',
    'bookings:read-own',
  'bookings:write',
    'technician:work'
  ]),
  admin: new Set<Permission>(permissions)
};

export function hasPermission(roles: readonly AppRole[], permission: Permission) {
  return roles.some((role) => rolePermissions[role].has(permission));
}
