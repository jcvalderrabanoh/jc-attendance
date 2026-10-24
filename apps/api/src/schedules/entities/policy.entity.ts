import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common';

export enum RoundingModeEnum {
  None = 'none',
  Nearest = 'nearest',
  Up = 'up',
  Down = 'down',
}

export enum OvertimeModeEnum {
  LftMx = 'LFT_MX',
  Daily = 'daily',
  Weekly = 'weekly',
  None = 'none',
}

/** Reglas de asistencia. Se aplica la más específica: empleado › cuenta. */
@Entity({ name: 'policies' })
@Index(['accountId', 'status'])
export class Policy extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'smallint', default: 10 })
  graceInMinutes: number;

  @Column({ type: 'smallint', default: 0 })
  graceOutMinutes: number;

  @Column({ type: 'smallint', default: 0 })
  roundingMinutes: number;

  @Column({ type: 'varchar', length: 10, default: RoundingModeEnum.None })
  roundingMode: RoundingModeEnum;

  @Column({ type: 'smallint', default: 10 })
  lateThresholdMinutes: number;

  @Column({ type: 'smallint', default: 120 })
  absenceAfterMinutes: number;

  /** Minutos antes del turno en que se permite checar entrada. */
  @Column({ type: 'smallint', default: 60 })
  earlyClockInMinutes: number;

  @Column({ type: 'smallint', default: 14 })
  autoClockOutAfterHours: number;

  @Column({ type: 'boolean', default: false })
  requireSelfie: boolean;

  @Column({ type: 'boolean', default: true })
  requireGeofence: boolean;

  @Column({ type: 'boolean', default: false })
  requireQr: boolean;

  @Column({ type: 'boolean', default: true })
  allowOffline: boolean;

  @Column({ type: 'smallint', default: 24 })
  maxOfflineHours: number;

  @Column({ type: 'varchar', length: 10, default: OvertimeModeEnum.LftMx })
  overtimeMode: OvertimeModeEnum;

  @Column({ type: 'boolean', default: true })
  overtimeRequiresApproval: boolean;

  @Column({ type: 'boolean', default: true })
  sundayPremium: boolean;
}
