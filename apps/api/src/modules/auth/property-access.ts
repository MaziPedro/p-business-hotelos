import type { AuthUser } from './current-user.decorator';

/** Platform-level roles that bypass property scoping. */
export const PLATFORM_ROLES = new Set(['admin', 'platform_admin', 'superadmin']);

/** Roles allowed to change a hotel's profile and branding. */
export const PROPERTY_MANAGEMENT_ROLES = new Set([
  ...PLATFORM_ROLES,
  'hotel_owner',
  'property_admin',
  'general_manager',
]);

/** Whether a principal may access a property at all. */
export function userCanAccessProperty(user: AuthUser, propertyId: string): boolean {
  if (user.roles?.some((r) => PLATFORM_ROLES.has(r))) return true;
  return (user.propertyIds ?? []).includes(propertyId);
}

/** Profile management requires both an appropriate role and tenant membership. */
export function userCanManageProperty(user: AuthUser, propertyId: string): boolean {
  return (
    user.roles?.some((r) => PROPERTY_MANAGEMENT_ROLES.has(r)) === true &&
    userCanAccessProperty(user, propertyId)
  );
}
