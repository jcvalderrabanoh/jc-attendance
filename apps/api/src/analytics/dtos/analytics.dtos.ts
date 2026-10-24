import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const CHART_METRICS = [
  'worked_hours',
  'overtime_hours',
  'late_count',
  'late_minutes',
  'absence_count',
  'attendance_rate',
  'punctuality_rate',
  'night_hours',
] as const;
export type ChartMetric = (typeof CHART_METRICS)[number];

export const CHART_DIMENSIONS = ['date', 'week', 'weekday', 'location', 'department', 'position', 'employee', 'custom_field'] as const;
export type ChartDimension = (typeof CHART_DIMENSIONS)[number];

export class AnalyticsRangeDto {
  @ApiProperty() @Matches(DATE) from: string;
  @ApiProperty() @Matches(DATE) to: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
}

export class ChartQueryDto extends AnalyticsRangeDto {
  @ApiProperty({ enum: CHART_METRICS }) @IsIn(CHART_METRICS as unknown as string[]) metric: ChartMetric;
  @ApiProperty({ enum: CHART_DIMENSIONS }) @IsIn(CHART_DIMENSIONS as unknown as string[]) dimension: ChartDimension;
  /** Clave del campo personalizado cuando dimension = custom_field. */
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[a-z][a-z0-9_]{1,59}$/) customFieldKey?: string;
}
