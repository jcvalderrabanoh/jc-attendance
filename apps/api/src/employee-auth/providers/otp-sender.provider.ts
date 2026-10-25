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
   * WhatsApp en Verify exige ligar un remitente en la consola de Twilio. Sin
   * eso Verify ACEPTA la petición pero no entrega (no hay error que dispare
   * un reintento), así que solo se usa con `TWILIO_VERIFY_WHATSAPP=true`;
   * si no, va directo por SMS. Con WhatsApp habilitado, un error explícito
   * también cae a SMS.
   */
  async send(destination: string, channel: OtpChannelEnum): Promise<OtpChannelEnum> {
    if (channel === OtpChannelEnum.Whatsapp && process.env.TWILIO_VERIFY_WHATSAPP !== 'true') {
      await this.start(destination, OtpChannelEnum.Sms);
      return OtpChannelEnum.Sms;
    }
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

/**
 * Producción: la misma plantilla de WhatsApp AUTHENTICATION aprobada en Meta
 * que usa jc-core para su código de alta (`TWILIO_SIGNUP_OTP_CONTENT_SID`,
 * remitente `TWILIO_WHATSAPP_FROM`). El código lo genera y valida el
 * Checador. Si WhatsApp falla, cae a SMS por la API de mensajes
 * (`TWILIO_PHONE_NUMBER`). Nunca manda WhatsApp en texto libre: Meta lo
 * bloquea fuera de la ventana de 24 h (63016).
 */
@Injectable()
export class TwilioMessagingOtpSender implements OtpSender {
  readonly managesCode = false;
  private readonly logger = new Logger('OTP');

  async send(destination: string, channel: OtpChannelEnum, code?: string): Promise<OtpChannelEnum> {
    if (!code) throw new Error('Falta el código a enviar');
    if (channel === OtpChannelEnum.Email) throw new Error('El envío por email no está habilitado');
    if (channel === OtpChannelEnum.Whatsapp) {
      try {
        await this.whatsapp(destination, code);
        return OtpChannelEnum.Whatsapp;
      } catch (err) {
        if (!process.env.TWILIO_PHONE_NUMBER) throw err;
        this.logger.warn(`WhatsApp falló (${(err as Error).message}); se envía por SMS`);
      }
    }
    await this.sms(destination, code);
    return OtpChannelEnum.Sms;
  }

  private async whatsapp(destination: string, code: string): Promise<void> {
    const contentSid = process.env.TWILIO_SIGNUP_OTP_CONTENT_SID;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    if (!contentSid || !from) throw new Error('Falta la plantilla o el remitente de WhatsApp');
    await this.message({
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      To: `whatsapp:${destination}`,
      ContentSid: contentSid,
      ContentVariables: JSON.stringify({ '1': code }),
    });
  }

  private async sms(destination: string, code: string): Promise<void> {
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) throw new Error('No hay número de SMS configurado');
    await this.message({
      From: from,
      To: destination,
      Body: `Tu código del Checador es ${code}. Caduca en 10 minutos. No lo compartas.`,
    });
  }

  private async message(params: Record<string, string>): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
  }
}

export function createOtpSender(provider = process.env.OTP_PROVIDER): OtpSender {
  if (provider === 'twilio-messaging') return new TwilioMessagingOtpSender();
  if (provider === 'twilio') return new TwilioVerifyOtpSender();
  return new LogOtpSender();
}

export const otpSenderProvider = {
  provide: OTP_SENDER,
  useFactory: (): OtpSender => createOtpSender(),
};
