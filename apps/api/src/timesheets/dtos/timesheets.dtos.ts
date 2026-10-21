import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { IncidentStatusEnum, IncidentTypeEnum } from '../entities';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class DateRangeQueryDto {
  @ApiProperty({ example: '2026-10-01' }) @Matches(DATE) from: string;
  @ApiProperty({ example: '2026-10-31' }) @Matches(DATE) to: string;
}

export class TimesheetQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() employmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
}

export class RecalculateDto extends DateRangeQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() employmentId?: string;
}

export class ListIncidentsQueryDto {
  @ApiPropertyOptional() @IsOptional() @Matches(DATE) from?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(DATE) to?: string;
  @ApiPropertyOptional({ enum: IncidentTypeEnum }) @IsOptional() @IsEnum(IncidentTypeEnum) type?: IncidentTypeEnum;
  @ApiPropertyOptional({ enum: IncidentStatusEnum }) @IsOptional() @IsEnum(IncidentStatusEnum) status?: IncidentStatusEnum;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employmentId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}

export class IncidentDecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 300) comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() requestId?: string;
}
