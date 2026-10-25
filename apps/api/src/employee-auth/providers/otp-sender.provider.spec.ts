import { OtpChannelEnum } from '../entities';
import { otpSenderProvider, TwilioMessagingOtpSender, TwilioVerifyOtpSender } from './otp-sender.provider';

const ok = (body: unknown = {}) => ({ ok: true, status: 201, json: async () => body, text: async () => '' });
const fail = (status: number, text: string) => ({ ok: false, status, json: async () => ({}), text: async () => text });

describe('TwilioVerifyOtpSender', () => {
  const realFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1';
    process.env.TWILIO_AUTH_TOKEN = 'tok';
    process.env.TWILIO_VERIFY_SERVICE_SID = 'VA1';
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  const body = (call: number) => new URLSearchParams(String(fetchMock.mock.calls[call][1].body));

  it('envía por el canal pedido con autenticación básica y locale es', async () => {
    fetchMock.mockResolvedValue(ok());
    await expect(new TwilioVerifyOtpSender().send('+525512345678', OtpChannelEnum.Sms)).resolves.toBe(OtpChannelEnum.Sms);
    expect(fetchMock.mock.calls[0][0]).toBe('https://verify.twilio.com/v2/Services/VA1/Verifications');
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe(`Basic ${Buffer.from('AC1:tok').toString('base64')}`);
    expect(Object.fromEntries(body(0))).toEqual({ To: '+525512345678', Channel: 'sms', Locale: 'es' });
  });

  it('sin remitente de WhatsApp ligado (por defecto) va directo por SMS', async () => {
    fetchMock.mockResolvedValue(ok());
    await expect(new TwilioVerifyOtpSender().send('+525512345678', OtpChannelEnum.Whatsapp)).resolves.toBe(OtpChannelEnum.Sms);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body(0).get('Channel')).toBe('sms');
  });

  it('con TWILIO_VERIFY_WHATSAPP=true, si WhatsApp falla reintenta por SMS y lo informa', async () => {
    process.env.TWILIO_VERIFY_WHATSAPP = 'true';
    fetchMock.mockResolvedValueOnce(fail(400, 'channel disabled')).mockResolvedValueOnce(ok());
    await expect(new TwilioVerifyOtpSender().send('+525512345678', OtpChannelEnum.Whatsapp)).resolves.toBe(OtpChannelEnum.Sms);
    expect(body(0).get('Channel')).toBe('whatsapp');
    expect(body(1).get('Channel')).toBe('sms');
    delete process.env.TWILIO_VERIFY_WHATSAPP;
  });

  it('SMS o email fallidos no se reintentan', async () => {
    fetchMock.mockResolvedValue(fail(400, 'invalid'));
    await expect(new TwilioVerifyOtpSender().send('a@b.mx', OtpChannelEnum.Email)).rejects.toThrow('Twilio Verify 400');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('check aprueba solo con status approved', async () => {
    fetchMock.mockResolvedValueOnce(ok({ status: 'approved' })).mockResolvedValueOnce(ok({ status: 'pending' })).mockResolvedValueOnce(fail(404, ''));
    const sender = new TwilioVerifyOtpSender();
    await expect(sender.check('+525512345678', '123456')).resolves.toBe(true);
    await expect(sender.check('+525512345678', '000000')).resolves.toBe(false);
    await expect(sender.check('+525512345678', '000000')).resolves.toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe('https://verify.twilio.com/v2/Services/VA1/VerificationCheck');
  });

  it('OTP_PROVIDER elige el proveedor', () => {
    process.env.OTP_PROVIDER = 'twilio';
    expect(otpSenderProvider.useFactory()).toBeInstanceOf(TwilioVerifyOtpSender);
    process.env.OTP_PROVIDER = 'twilio-messaging';
    expect(otpSenderProvider.useFactory()).toBeInstanceOf(TwilioMessagingOtpSender);
    process.env.OTP_PROVIDER = 'log';
    expect(otpSenderProvider.useFactory().managesCode).toBe(false);
    delete process.env.OTP_PROVIDER;
  });
});

describe('TwilioMessagingOtpSender (plantilla de WhatsApp de jc-core)', () => {
  const realFetch = global.fetch;
  let fetchMock: jest.Mock;
  const body = (call: number) => Object.fromEntries(new URLSearchParams(String(fetchMock.mock.calls[call][1].body)));

  beforeEach(() => {
    Object.assign(process.env, {
      TWILIO_ACCOUNT_SID: 'AC1',
      TWILIO_AUTH_TOKEN: 'tok',
      TWILIO_WHATSAPP_FROM: '+5215500000000',
      TWILIO_SIGNUP_OTP_CONTENT_SID: 'HX1',
      TWILIO_PHONE_NUMBER: '+15550000000',
    });
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it('el Checador genera el código (no lo maneja Twilio)', () => {
    expect(new TwilioMessagingOtpSender().managesCode).toBe(false);
  });

  it('WhatsApp con la plantilla aprobada y el código como variable 1', async () => {
    fetchMock.mockResolvedValue(ok());
    await expect(new TwilioMessagingOtpSender().send('+525512345678', OtpChannelEnum.Whatsapp, '123456')).resolves.toBe(
      OtpChannelEnum.Whatsapp,
    );
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json');
    expect(body(0)).toEqual({
      From: 'whatsapp:+5215500000000',
      To: 'whatsapp:+525512345678',
      ContentSid: 'HX1',
      ContentVariables: '{"1":"123456"}',
    });
  });

  it('nunca manda WhatsApp en texto libre; si falla cae a SMS', async () => {
    fetchMock.mockResolvedValueOnce(fail(400, '63016')).mockResolvedValueOnce(ok());
    await expect(new TwilioMessagingOtpSender().send('+525512345678', OtpChannelEnum.Whatsapp, '123456')).resolves.toBe(
      OtpChannelEnum.Sms,
    );
    expect(body(0)).not.toHaveProperty('Body');
    expect(body(1)).toMatchObject({ From: '+15550000000', To: '+525512345678' });
    expect(body(1).Body).toContain('123456');
  });

  it('sin número de SMS, el fallo de WhatsApp se propaga', async () => {
    delete process.env.TWILIO_PHONE_NUMBER;
    fetchMock.mockResolvedValue(fail(400, 'x'));
    await expect(new TwilioMessagingOtpSender().send('+525512345678', OtpChannelEnum.Whatsapp, '123456')).rejects.toThrow(
      'Twilio 400',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('email no está habilitado', async () => {
    await expect(new TwilioMessagingOtpSender().send('a@b.mx', OtpChannelEnum.Email, '123456')).rejects.toThrow('email');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
