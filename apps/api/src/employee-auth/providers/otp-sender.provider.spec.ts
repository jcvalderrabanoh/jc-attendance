import { OtpChannelEnum } from '../entities';
import { otpSenderProvider, TwilioVerifyOtpSender } from './otp-sender.provider';

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

  it('si WhatsApp falla, reintenta por SMS y lo informa', async () => {
    fetchMock.mockResolvedValueOnce(fail(400, 'channel disabled')).mockResolvedValueOnce(ok());
    await expect(new TwilioVerifyOtpSender().send('+525512345678', OtpChannelEnum.Whatsapp)).resolves.toBe(OtpChannelEnum.Sms);
    expect(body(0).get('Channel')).toBe('whatsapp');
    expect(body(1).get('Channel')).toBe('sms');
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
    expect(otpSenderProvider.useFactory().managesCode).toBe(true);
    process.env.OTP_PROVIDER = 'log';
    expect(otpSenderProvider.useFactory().managesCode).toBe(false);
    delete process.env.OTP_PROVIDER;
  });
});
