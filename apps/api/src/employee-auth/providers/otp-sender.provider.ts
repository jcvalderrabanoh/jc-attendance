import { Injectable, Logger } from '@nestjs/common';
import { OtpChannelEnum } from '../entities';

export const OTP_SENDER = 'OTP_SENDER';

/**
 * Envía el código. `managesCode` = true cuando el proveedor genera y valida
 * el código (Twilio Verify); si no, el código lo genera y guarda el Checador.
 */
export interface OtpSender {
  readonly managesCode: boolean;
  /** Devuelve el canal por el que salió de verdad (puede caer de WhatsApp a SMS). */
  send(destination: string, channel: OtpChannelEnum, code?: string): Promise<OtpChannelEnum | void>;
  check?(destination: string, code: string): Promise<boolean>;
}

/** Desarrollo: escribe el código en el log. */
@Injectable()
export class LogOtpSender implements OtpSender {
  readonly managesCode = false;
  private readonly logger = new Logger('OTP');

  async send(destination: string, channel: OtpChannelEnum, code?: string): Promise<void> {
    this.logger.warn(`[${channel}] ${destination} → código ${code}`);
  }
}

/** Producción: Twilio Verify (SMS, WhatsApp o email). Llama a la API REST sin SDK. */
@Injectable()
export class TwilioVerifyOtpSender implements OtpSender {
  readonly managesCode = true;
  private readonly logger = new Logger('OTP');

  private get auth(): string {
    return Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  }

  private url(path: string): string {
    return `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/${path}`;
  }

  /**
   * WhatsApp en Verify exige ligar un remitente en la consola de Twilio; si
   * aún no está (o el número no tiene WhatsApp), se reintenta por SMS para
   * que el empleado no se quede sin código.
   */
  async send(destination: string, channel: OtpChannelEnum): Promise<OtpChannelEnum> {
    try {
      await this.start(destination, channel);
      return channel;
    } catch (err) {
      if (channel !== OtpChannelEnum.Whatsapp) throw err;
      this.logger.warn(`WhatsApp no disponible (${(err as Error).message}); se envía por SMS`);
      await this.start(destination, OtpChannelEnum.Sms);
      return OtpChannelEnum.Sms;
    }
  }

  private async start(destination: string, channel: OtpChannelEnum): Promise<void> {
    const res = await fetch(this.url('Verifications'), {
      method: 'POST',
      headers: { authorization: `Basic ${this.auth}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: destination, Channel: channel, Locale: 'es' }),
    });
    if (!res.ok) throw new Error(`Twilio Verify ${res.status}: ${await res.text()}`);
  }

  async check(destination: string, code: string): Promise<boolean> {
    const res = await fetch(this.url('VerificationCheck'), {
      method: 'POST',
      headers: { authorization: `Basic ${this.auth}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: destination, Code: code }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string };
    return body.status === 'approved';
  }
}

export const otpSenderProvider = {
  provide: OTP_SENDER,
  useFactory: (): OtpSender => (process.env.OTP_PROVIDER === 'twilio' ? new TwilioVerifyOtpSender() : new LogOtpSender()),
};
