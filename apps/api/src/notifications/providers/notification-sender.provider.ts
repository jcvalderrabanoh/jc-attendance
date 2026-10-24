import { Injectable, Logger } from '@nestjs/common';

export const NOTIFICATION_SENDER = 'NOTIFICATION_SENDER';

export interface NotificationSender {
  /** `to`: teléfono E.164 (WhatsApp/SMS) o email. */
  send(to: string, text: string): Promise<void>;
}

/** Desarrollo: deja el mensaje en el log. */
@Injectable()
export class LogNotificationSender implements NotificationSender {
  private readonly logger = new Logger('Notificación');

  async send(to: string, text: string): Promise<void> {
    this.logger.log(`→ ${to}: ${text}`);
  }
}

/** WhatsApp por Twilio Messages (`TWILIO_WHATSAPP_FROM`, ej. whatsapp:+14155238886). Sin SDK. */
@Injectable()
export class TwilioWhatsappSender implements NotificationSender {
  async send(to: string, text: string): Promise<void> {
    if (!to.startsWith('+')) return; // email: fuera del MVP
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: `whatsapp:${to}`, From: process.env.TWILIO_WHATSAPP_FROM ?? '', Body: text }),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
  }
}

export const notificationSenderProvider = {
  provide: NOTIFICATION_SENDER,
  useFactory: (): NotificationSender => (process.env.NOTIFICATIONS_PROVIDER === 'twilio' ? new TwilioWhatsappSender() : new LogNotificationSender()),
};
