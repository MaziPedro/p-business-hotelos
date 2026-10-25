import { describe, expect, it } from 'vitest';
import type { AuthUser } from './current-user.decorator';
import { userCanAccessProperty, userCanManageProperty } from './property-access';

const hotelA = '11111111-1111-4111-8111-111111111111';
const hotelB = '22222222-2222-4222-8222-222222222222';

function user(roles: string[], propertyIds: string[] = []): AuthUser {
  return {
    sub: 'test-user',
    email: 'hotel@example.com',
    name: 'Hotel User',
    roles,
    propertyIds,
  };
}

describe('property access', () => {
  it('allows a hotel owner to manage a property they belong to', () => {
    expect(userCanManageProperty(user(['hotel_owner'], [hotelA]), hotelA)).toBe(true);
  });

  it('allows a property admin to manage a property they belong to', () => {
    expect(userCanManageProperty(user(['property_admin'], [hotelA]), hotelA)).toBe(true);
  });

  it('denies hotel owners access to another hotel', () => {
    const owner = user(['hotel_owner'], [hotelA]);
    expect(userCanAccessProperty(owner, hotelB)).toBe(false);
    expect(userCanManageProperty(owner, hotelB)).toBe(false);
  });

  it('does not allow an ordinary staff member to edit branding', () => {
    expect(userCanManageProperty(user(['front_desk'], [hotelA]), hotelA)).toBe(false);
  });

  it('allows platform admins to manage any property', () => {
    expect(userCanManageProperty(user(['platform_admin']), hotelB)).toBe(true);
  });
});
