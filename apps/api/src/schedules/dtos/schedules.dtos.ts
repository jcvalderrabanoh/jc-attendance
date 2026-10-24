import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { OvertimeModeEnum, RoundingModeEnum, ScheduleTypeEnum } from '../entities';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpsertPolicyDto {
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(120) graceInMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(120) graceOutMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(60) roundingMinutes?: number;
  @ApiPropertyOptional({ enum: RoundingModeEnum }) @IsOptional() @IsEnum(RoundingModeEnum) roundingMode?: RoundingModeEnum;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(240) lateThresholdMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(720) absenceAfterMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(240) earlyClockInMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(24) autoClockOutAfterHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireSelfie?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireGeofence?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireQr?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowOffline?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(168) maxOfflineHours?: number;
  @ApiPropertyOptional({ enum: OvertimeModeEnum }) @IsOptional() @IsEnum(OvertimeModeEnum) overtimeMode?: OvertimeModeEnum;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() overtimeRequiresApproval?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sundayPremium?: boolean;
}

export class ShiftDto {
  @ApiProperty({ description: '0 = domingo … 6 = sábado' }) @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @ApiProperty({ example: '09:00' }) @Matches(HHMM, { message: 'Hora en formato HH:mm' }) startTime: string;
  @ApiProperty({ example: '18:00' }) @Matches(HHMM, { message: 'Hora en formato HH:mm' }) endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(240) breakMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() paidBreak?: boolean;
}

export class UpsertScheduleDto {
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional({ enum: ScheduleTypeEnum }) @IsOptional() @IsEnum(ScheduleTypeEnum) type?: ScheduleTypeEnum;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(168) weeklyHoursTarget?: number;
  @ApiProperty({ type: [ShiftDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => ShiftDto) shifts: ShiftDto[];
}

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-12-12' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() mandatory?: boolean;
}
