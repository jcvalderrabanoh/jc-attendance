import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ConsentKindEnum, OtpChannelEnum } from '../entities';

export class RequestOtpDto {
  @ApiProperty({ description: 'Teléfono (10 dígitos o E.164) o email' }) @IsString() @Length(5, 255) destination: string;
  @ApiPropertyOptional({ enum: OtpChannelEnum }) @IsOptional() @IsEnum(OtpChannelEnum) channel?: OtpChannelEnum;
}

export class VerifyOtpDto {
  @ApiProperty() @IsString() @Length(5, 255) destination: string;
  @ApiProperty() @Matches(/^\d{6}$/, { message: 'El código es de 6 dígitos' }) code: string;
}

export class SelectEmploymentDto {
  @ApiProperty() @IsUUID() employmentId: string;
}

export class GrantConsentsDto {
  @ApiProperty({ enum: ConsentKindEnum, isArray: true }) @IsArray() @IsEnum(ConsentKindEnum, { each: true }) kinds: ConsentKindEnum[];
}

export class RevokeConsentDto {
  @ApiProperty({ enum: ConsentKindEnum }) @IsEnum(ConsentKindEnum) kind: ConsentKindEnum;
}
