import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { inspect } from 'node:util';
import { Test } from '@nestjs/testing';
import { FolioService } from './folio.service';
import { DRIZZLE } from '../../database/database.module';
import { WebhookService } from '../webhook/webhook.service';
import { TaxService } from '../tax/tax.service';

/**
 * Cross-tenant FK ownership for FolioService.create (follow-on to audit #4-6,
 * flagged by Codex re-audit as the same anti-pattern on `reservationId` and
 * `bookingId`).
 */
const A = 'aaaaaaaa-0000-4000-a000-000000000001';

function mkDbSeq(rows: any[][]) {
  let i = 0;
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve(rows[i++] ?? [])),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'f-1' }]) }),
    }),
  };
}

async function mkSvc(db: any, webhook = { emit: vi.fn() }) {
  const mod = await Test.createTestingModule({
    providers: [
      FolioService,
      { provide: DRIZZLE, useValue: db },
      { provide: WebhookService, useValue: webhook },
      { provide: TaxService, useValue: {} },
    ],
  }).compile();
  return mod.get(FolioService);
}

describe('FolioService — cross-tenant FK ownership', () => {
  it('rejects when dto.reservationId belongs to another property', async () => {
    const db = mkDbSeq([
      [], // reservation FK check empty → foreign
    ]);
    const svc = await mkSvc(db);
    await expect(
      svc.create({ propertyId: A, reservationId: 'foreign-r', guestId: 'g', type: 'guest' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('rejects when dto.bookingId belongs to another property (reservation OK)', async () => {
    const db = mkDbSeq([
      [{ id: 'r-1' }], // reservation FK OK
      [],              // booking FK empty → foreign
    ]);
    const svc = await mkSvc(db);
    await expect(
      svc.create({ propertyId: A, reservationId: 'r-1', bookingId: 'foreign-b', guestId: 'g', type: 'guest' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('scopes folio detail reads by folio id and property id', async () => {
    let whereCondition: unknown;
    const db: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation((condition: unknown) => {
            whereCondition = condition;
            return Promise.resolve([]);
          }),
        }),
      }),
    };
    const svc = await mkSvc(db);

    await expect(svc.findById('foreign-folio', A)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(whereCondition).toBeDefined();
    const predicate = inspect(whereCondition, { depth: 10 });
    expect(predicate).toContain('property_id');
    expect(predicate).toContain('id');
  });


  it('does not update a folio ID that is outside the requested property', async () => {
    const db: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      update: vi.fn(),
    };
    const svc = await mkSvc(db);

    await expect(
      svc.update('foreign-folio', A, { notes: 'unauthorized update' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.update).not.toHaveBeenCalled();
  });


  it('does not transfer a charge to a folio outside the requested property', async () => {
    let lockLookup = 0;
    const db: any = {
      transaction: vi.fn(async (work: (tx: any) => Promise<unknown>) => work(db)),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            for: vi.fn(async () => {
              lockLookup += 1;
              return lockLookup === 1
                ? [{ id: 'folio-a', status: 'open' }]
                : []; // target folio does not belong to this property
            }),
          })),
        })),
      })),
      update: vi.fn(),
      insert: vi.fn(),
    };
    const svc = await mkSvc(db);

    await expect(
      svc.transferCharge('folio-a', A, {
        chargeId: 'charge-1',
        targetFolioId: 'folio-z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });


  it('does not reverse a charge outside the requested property or emit a webhook', async () => {
    let whereCondition: unknown;
    const webhook = { emit: vi.fn() };
    const db: any = {
      transaction: vi.fn(async (work: (tx: any) => Promise<unknown>) => work(db)),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation((condition: unknown) => {
            whereCondition = condition;
            return Promise.resolve([]); // charge not owned by this property/folio
          }),
        }),
      }),
      insert: vi.fn(),
    };
    const svc = await mkSvc(db, webhook);

    await expect(svc.reverseCharge('folio-a', 'foreign-charge', A))
      .rejects.toBeInstanceOf(NotFoundException);
    const predicate = inspect(whereCondition, { depth: 10 });
    expect(predicate).toContain('property_id');
    expect(predicate).toContain('folio_id');
    expect(predicate).toContain('id');
    expect(db.insert).not.toHaveBeenCalled();
    expect(webhook.emit).not.toHaveBeenCalled();
  });

});
