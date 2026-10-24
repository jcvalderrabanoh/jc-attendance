import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Matches } from 'class-validator';
import { ReportFormatEnum, ReportTypeEnum } from '../entities';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateReportDto {
  @ApiProperty({ enum: ReportTypeEnum }) @IsEnum(ReportTypeEnum) type: ReportTypeEnum;
  @ApiProperty({ enum: ReportFormatEnum }) @IsEnum(ReportFormatEnum) format: ReportFormatEnum;
  @ApiProperty() @Matches(DATE) from: string;
  @ApiProperty() @Matches(DATE) to: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
}

export class ListReportsQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}

export interface ReportParams {
  from: string;
  to: string;
  employmentId?: string;
  locationId?: string;
  departmentId?: string;
}
