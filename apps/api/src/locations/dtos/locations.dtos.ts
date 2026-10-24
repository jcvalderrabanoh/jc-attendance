import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { GeofenceKindEnum } from '../entities';

export class UpsertLocationDto {
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 40) code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 300) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsLatitude() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsLongitude() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() timeZone?: string;
  @ApiPropertyOptional({ enum: GeofenceKindEnum }) @IsOptional() @IsEnum(GeofenceKindEnum) geofenceKind?: GeofenceKindEnum;
  /** Radio libre (no fijo, a diferencia de Homebase). */
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(20) @Max(5000) radiusMeters?: number;
  @ApiPropertyOptional({ type: 'array' }) @IsOptional() @IsArray() @ArrayMinSize(3) polygon?: [number, number][];
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(10) @Max(2000) maxAccuracyMeters?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) allowedIpCidrs?: string[];
  @ApiPropertyOptional() @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}

export class CreateKioskDto {
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiProperty() @IsUUID() locationId: string;
}

export class ActivateKioskDto {
  @ApiProperty({ description: 'Código de 8 caracteres generado en la consola' })
  @IsString()
  @Length(8, 8)
  code: string;
}
