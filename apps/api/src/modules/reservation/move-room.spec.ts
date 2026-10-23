import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { AvailabilityService } from './availability.service';
import { FolioService } from '../folio/folio.service';
import { RoomStatusService } from '../room/room-status.service';
import { PaymentService } from '../payment/payment.service';
import { WebhookService } from '../webhook/webhook.service';
import { AncillaryService } from '../ancillary/ancillary.service';
import { PolicyService } from '../policy/policy.service';
import { DepositSettlementService } from '../accounting/deposit-settlement.service';
import { RatePlanService } from '../rate-plan/rate-plan.service';
import { DRIZZLE } from '../../database/database.module';

describe('ReservationService.moveRoom', () => {
  let svc: ReservationService;
  let db: any;
  const roomStatus = {
    markOccupied: vi.fn().mockResolvedValue({}),
    markVacantDirty: vi.fn().mockResolvedValue({}),
  };
  const webhook = { emit: vi.fn().mockResolvedValue(undefined) };
  let roomConflict = false;
  let updateWins = true;

  const reservation = {
    id: 'res-001',
    propertyId: 'prop-001',
    roomTypeId: 'rt-001',
    roomId: 'room-old',
    status: 'checked_in',
    doNotMove: false,
  };

  const targetRoom = {
    id: 'room-new',
    propertyId: 'prop-001',
    roomTypeId: 'rt-001',
    status: 'guest_ready',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    roomConflict = false;
    updateWins = true;
    const tx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([targetRoom]),
            limit: vi.fn().mockImplementation(async () => roomConflict ? [{ id: 'res-other' }] : []),
          }),
        }),
      })),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(async () => updateWins ? [{ ...reservation, roomId: 'room-new' }] : []),
          }),
        }),
      }),
    };
    db = {
      transaction: vi.fn(async (callback: (tx: any) => unknown) => callback(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: DRIZZLE, useValue: db },
        { provide: AvailabilityService, useValue: {} },
        { provide: FolioService, useValue: {} },
        { provide: RoomStatusService, useValue: roomStatus },
        { provide: PaymentService, useValue: {} },
        { provide: WebhookService, useValue: webhook },
        {
          provide: AncillaryService,
          useValue: {
            ensurePackageComponents: async () => [],
            postOnceForReservation: async () => ({ posted: [] }),
          },
        },
        {
          provide: PolicyService,
          useValue: { evaluateCancellation: async () => ({}) },
        },
        {
          provide: DepositSettlementService,
          useValue: { settleFromEvaluation: async () => null, applyHeldDeposits: async () => [] },
        },
      { provide: RatePlanService, useValue: { assertSellable: vi.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    svc = module.get(ReservationService);
    vi.spyOn(svc as any, 'findByIdRaw').mockResolvedValue({ ...reservation });
  });

  it('moves in-house guest and flips room statuses', async () => {
    const updated = await svc.moveRoom('res-001', 'prop-001', { roomId: 'room-new' });
    expect(updated.roomId).toBe('room-new');
    expect(roomStatus.markVacantDirty).toHaveBeenCalledWith('room-old', 'prop-001');
    expect(roomStatus.markOccupied).toHaveBeenCalledWith('room-new', 'prop-001');
    expect(webhook.emit).toHaveBeenCalledWith(
      'reservation.room_moved',
      'reservation',
      'res-001',
      expect.objectContaining({ previousRoomId: 'room-old', newRoomId: 'room-new' }),
      'prop-001',
    );
  });

  it('rejects a move when the target room overlaps another active reservation', async () => {
    roomConflict = true;
    await expect(svc.moveRoom('res-001', 'prop-001', { roomId: 'room-new' })).rejects.toBeInstanceOf(ConflictException);
    expect(roomStatus.markOccupied).not.toHaveBeenCalled();
    expect(webhook.emit).not.toHaveBeenCalled();
  });

  it('rejects a stale room move when the guarded update claims no row', async () => {
    updateWins = false;
    await expect(svc.moveRoom('res-001', 'prop-001', { roomId: 'room-new' })).rejects.toBeInstanceOf(ConflictException);
    expect(roomStatus.markOccupied).not.toHaveBeenCalled();
    expect(webhook.emit).not.toHaveBeenCalled();
  });

  it('blocks do-not-move without override', async () => {
    vi.spyOn(svc as any, 'findByIdRaw').mockResolvedValue({
      ...reservation,
      doNotMove: true,
    });
    await expect(
      svc.moveRoom('res-001', 'prop-001', { roomId: 'room-new' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows do-not-move with override', async () => {
    vi.spyOn(svc as any, 'findByIdRaw').mockResolvedValue({
      ...reservation,
      doNotMove: true,
    });
    await svc.moveRoom('res-001', 'prop-001', {
      roomId: 'room-new',
      overrideDoNotMove: true,
    });
    expect(roomStatus.markOccupied).toHaveBeenCalled();
  });
});
