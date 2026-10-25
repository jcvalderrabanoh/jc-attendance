import { Inject, Injectable, Logger } from '@nestjs/common';
import { normalizePhoneE164 } from '@jc-attendance/rules-engine';
import { hashSecret, ProcessInterfaceResult, randomDigits, safeEqual } from '../../common';
import { OtpChallengeDao } from '../daos';
import { OtpChannelEnum } from '../entities';
import { OTP_SENDER, OtpSender } from '../providers';

export const OTP_TTL_MS = 10 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_PER_HOUR = 5;

export interface NormalizedDestination {
  destination: string;
  kind: 'phone' | 'email';
}

export function normalizeDestination(raw: string): NormalizedDestination | null {
  const value = raw.trim();
  if (value.includes('@')) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { destination: email, kind: 'email' } : null;
  }
  const phone = normalizePhoneE164(value);
  return phone ? { destination: phone, kind: 'phone' } : null;
}

/** Envía un código de 6 dígitos (máx. 5 por hora por destino). */
@Injectable()
export class RequestOtpProcess {
  private readonly logger = new Logger(RequestOtpProcess.name);

  constructor(
    private readonly otpDao: OtpChallengeDao,
    @Inject(OTP_SENDER) private readonly sender: OtpSender,
  ) {}

  async process(raw: string, channel: OtpChannelEnum | undefined, ip: string | null): Promise<ProcessInterfaceResult<{ destination: string; channel: OtpChannelEnum; expiresInSeconds: number }>> {
    const normalized = normalizeDestination(raw);
    if (!normalized) return { success: false, error: 'Teléfono o email inválido' };
    const resolvedChannel = normalized.kind === 'email' ? OtpChannelEnum.Email : channel === OtpChannelEnum.Sms ? OtpChannelEnum.Sms : OtpChannelEnum.Whatsapp;
    const recent = await this.otpDao.countSince(normalized.destination, new Date(Date.now() - 3600_000));
    if (recent >= OTP_MAX_PER_HOUR) return { success: false, error: 'Demasiados códigos; espera unos minutos' };

    const code = this.sender.managesCode ? undefined : randomDigits(6);
    let sentChannel = resolvedChannel;
    try {
      sentChannel = (await this.sender.send(normalized.destination, resolvedChannel, code)) ?? resolvedChannel;
    } catch (err) {
      this.logger.error(`No se pudo enviar el código a ${normalized.destination}: ${(err as Error).message}`);
      return { success: false, error: 'No pudimos enviar el código; intenta por otro medio' };
    }
    await this.otpDao.create({
      destination: normalized.destination,
      channel: sentChannel,
      codeHash: code ? hashSecret(`${normalized.destination}:${code}`) : 'provider',
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      ip,
    });
    return { success: true, data: { destination: normalized.destination, channel: sentChannel, expiresInSeconds: OTP_TTL_MS / 1000 } };
  }
}

/** Valida el código; tras 5 intentos fallidos el desafío queda inservible. */
@Injectable()
export class VerifyOtpProcess {
  constructor(
    private readonly otpDao: OtpChallengeDao,
    @Inject(OTP_SENDER) private readonly sender: OtpSender,
  ) {}

  async process(raw: string, code: string): Promise<ProcessInterfaceResult<NormalizedDestination>> {
    const normalized = normalizeDestination(raw);
    if (!normalized) return { success: false, error: 'Teléfono o email inválido' };
    const challenge = await this.otpDao.findActive(normalized.destination);
    if (!challenge || challenge.attempts >= OTP_MAX_ATTEMPTS) return { success: false, error: 'Código vencido; pide uno nuevo' };
    await this.otpDao.incrementAttempts(challenge.id);
    const valid = this.sender.managesCode
      ? await this.sender.check!(normalized.destination, code)
      : safeEqual(challenge.codeHash, hashSecret(`${normalized.destination}:${code}`));
    if (!valid) return { success: false, error: 'Código incorrecto' };
    await this.otpDao.consume(challenge.id);
    return { success: true, data: normalized };
  }
}
