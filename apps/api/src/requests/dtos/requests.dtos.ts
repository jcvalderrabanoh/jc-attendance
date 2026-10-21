import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { RequestStatusEnum, RequestTypeEnum } from '../entities';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateRequestDto {
  @ApiProperty({ enum: RequestTypeEnum }) @IsEnum(RequestTypeEnum) type: RequestTypeEnum;
  @ApiProperty() @Matches(DATE) fromDate: string;
  @ApiProperty() @Matches(DATE) toDate: string;
  /**
   * Corrección de marcaje: { punchType: 'in'|'out'|..., at: ISO, replacesPunchId?: uuid }.
   * Horas extra: { minutes: number }.
   */
  @ApiPropertyOptional() @IsOptional() @IsObject() payload?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) comment?: string;
}

export class DecideRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) comment?: string;
}

export class ListRequestsQueryDto {
  @ApiPropertyOptional({ enum: RequestStatusEnum }) @IsOptional() @IsEnum(RequestStatusEnum) status?: RequestStatusEnum;
  @ApiPropertyOptional({ enum: RequestTypeEnum }) @IsOptional() @IsEnum(RequestTypeEnum) type?: RequestTypeEnum;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employmentId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}
