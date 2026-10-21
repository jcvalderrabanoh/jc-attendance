import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CapturingOtpSender, coreToken, createApp, resetDatabase, seedCoreAccount } from './helpers';

/**
 * Flujo completo del Checador sobre Postgres real: alta por liga con
 * validación, OTP, marcajes, jornada calculada, analítica, reportes y kiosco.
 */
describe('Checador de punta a punta', () => {
  let app: INestApplication;
  let otp: CapturingOtpSender;
  let ds: DataSource;
  let http: ReturnType<typeof request>;
  let admin: string;
  let accountId: string;
  let locationId: string;
  let invitationToken: string;
  let requestId: string;
  let employeeToken: string;
  let employmentId: string;

  const api = (path: string) => `/api/v1${path}`;
  const phone = '5512345678';
  const phoneE164 = '+525512345678';

  beforeAll(async () => {
    await resetDatabase();
    ({ app, otp, ds } = await createApp());
    http = request(app.getHttpServer());
    const seeded = await seedCoreAccount(ds);
    accountId = seeded.accountId;
    admin = `Bearer ${coreToken(accountId, seeded.userId)}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('la primera entrada siembra la configuración por defecto de la cuenta', async () => {
    const settings = await http.get(api('/settings')).set('Authorization', admin).expect(200);
    expect(settings.body.displayName).toBe('Panadería La Espiga');
    expect(settings.body.geofenceMode).toBe('alert');
    const policies = await http.get(api('/policies')).set('Authorization', admin).expect(200);
    expect(policies.body[0].name).toBe('Política general');
    const holidays = await http.get(api(`/holidays?year=${new Date().getUTCFullYear()}`)).set('Authorization', admin).expect(200);
    expect(holidays.body.length).toBeGreaterThanOrEqual(7);
  });

  it('una cuenta sin el Checador contratado no entra', async () => {
    const other = await seedCoreAccount(ds, { withApp: false, name: 'Otra' });
    await http.get(api('/settings')).set('Authorization', `Bearer ${coreToken(other.accountId, other.userId)}`).expect(403);
  });

  it('configura sucursal con geocerca, campo personalizado y liga de alta', async () => {
    const loc = await http
      .post(api('/locations'))
      .set('Authorization', admin)
      .send({ name: 'Sucursal Centro', lat: 19.4326, lng: -99.1332, radiusMeters: 100 })
      .expect(201);
    locationId = loc.body.id;
    await http
      .post(api('/custom-fields'))
      .set('Authorization', admin)
      .send({ entity: 'employment', key: 'talla', label: 'Talla de uniforme', type: 'select', options: ['CH', 'M', 'G'], required: true, askOnOnboarding: true, chartable: true })
      .expect(201);
    const inv = await http
      .post(api('/invitations'))
      .set('Authorization', admin)
      .send({ name: 'Panaderos octubre', defaultLocationId: locationId, maxUses: 5, requireApproval: true, requiredFields: ['curp'] })
      .expect(201);
    invitationToken = inv.body.token;
    expect(inv.body.url).toContain(`/unirse/${invitationToken}`);
    expect(inv.body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(inv.body.tokenHash).toBeDefined(); // solo el hash se guarda
  });

  it('el formulario público muestra lo que pide la empresa', async () => {
    const info = await http.get(api(`/join/${invitationToken}`)).expect(200);
    expect(info.body.accountName).toBe('Panadería La Espiga');
    expect(info.body.requiredFields).toEqual(['curp']);
    expect(info.body.customFields.map((f: { key: string }) => f.key)).toEqual(['talla']);
    await http.get(api('/join/token-que-no-existe')).expect(404);
  });

  it('las reglas bloqueantes rechazan el alta sin quemar el código', async () => {
    await http.post(api(`/join/${invitationToken}/otp`)).send({ phone }).expect(201);
    const code = otp.codes.get(phoneE164)!;
    const bad = await http
      .post(api(`/join/${invitationToken}`))
      .send({ identity: { firstName: 'Juan', lastName: 'Pérez', phone, curp: 'XXXX000000XXXXXX00' }, otpCode: code, customFields: { talla: 'XL' }, consents: ['privacy_notice'] })
      .expect(400);
    expect(bad.body.message).toMatch(/CURP/);
    expect(bad.body.message).toMatch(/Talla/);

    const ok = await http
      .post(api(`/join/${invitationToken}`))
      .send({
        identity: { firstName: 'Juan', lastName: 'Pérez', phone, curp: 'HEGG560427MVZRRL04', rfc: 'MAL' },
        otpCode: code,
        customFields: { talla: 'M' },
        consents: ['privacy_notice', 'geolocation'],
      });
    expect(ok.status === 201 ? 'ok' : JSON.stringify(ok.body)).toBe('ok');
    expect(ok.body.reviewStatus).toBe('pending');
    expect(ok.body.findings.map((f: { ruleKey: string }) => f.ruleKey)).toContain('rfc_format');
    requestId = ok.body.requestId;
  });

  it('RH ve la solicitud con el resultado de cada regla y la aprueba', async () => {
    const list = await http.get(api('/onboarding/requests?status=pending')).set('Authorization', admin).expect(200);
    expect(list.body.pendingCount).toBe(1);
    const detail = await http.get(api(`/onboarding/requests/${requestId}`)).set('Authorization', admin).expect(200);
    expect(detail.body.validationResults.find((r: { ruleKey: string }) => r.ruleKey === 'rfc_format').outcome).toBe('warn');
    expect(detail.body.riskScore).toBe(20);
    await http.post(api(`/onboarding/requests/${requestId}/reject`)).set('Authorization', admin).send({}).expect(400); // motivo obligatorio
    const approved = await http.post(api(`/onboarding/requests/${requestId}/approve`)).set('Authorization', admin).send({ employeeNumber: 'E-001' }).expect(201);
    expect(approved.body.reviewStatus).toBe('approved');
  });

  it('el empleado entra con código de WhatsApp y su patrón ya viene elegido', async () => {
    await http.post(api('/employee-auth/otp')).send({ destination: phone }).expect(201);
    const login = await http.post(api('/employee-auth/verify')).send({ destination: phone, code: otp.codes.get(phoneE164) }).expect(201);
    expect(login.body.requiresAccountSelection).toBe(false);
    expect(login.body.accountId).toBe(accountId);
    employeeToken = `Bearer ${login.body.token}`;
    employmentId = login.body.employmentId;
    await http.post(api('/employee-auth/verify')).send({ destination: phone, code: '000000' }).expect(400);
  });

  it('checa entrada dentro de la geocerca y salida fuera (va a revisión)', async () => {
    const key = () => `k-${Math.random().toString(36).slice(2)}`;
    const now = new Date();
    const inKey = key();
    const entry = await http
      .post(api('/me/punches'))
      .set('Authorization', employeeToken)
      .send({ idempotencyKey: inKey, clientAt: now.toISOString(), lat: 19.4327, lng: -99.1333, accuracyMeters: 10 })
      .expect(201);
    expect(entry.body.punch.type).toBe('in');
    expect(entry.body.punch.reviewStatus).toBe('auto_ok');
    expect(entry.body.locationName).toBe('Sucursal Centro');

    // Reintento offline con la misma clave: no duplica.
    const again = await http.post(api('/me/punches')).set('Authorization', employeeToken).send({ idempotencyKey: inKey, clientAt: now.toISOString() }).expect(201);
    expect(again.body.duplicate).toBe(true);

    const exit = await http
      .post(api('/me/punches'))
      .set('Authorization', employeeToken)
      .send({ idempotencyKey: key(), clientAt: new Date().toISOString(), lat: 19.45, lng: -99.1332, accuracyMeters: 10 })
      .expect(201);
    expect(exit.body.punch.type).toBe('out');
    expect(exit.body.punch.riskFlags).toContain('out_of_geofence');
    expect(exit.body.punch.reviewStatus).toBe('pending');
    expect(exit.body.punch.prevHash).toBe(entry.body.punch.hash);

    const status = await http.get(api('/me/status')).set('Authorization', employeeToken).expect(200);
    expect(status.body.state).toBe('out');
    expect(status.body.perDay).toHaveLength(7);
  });

  it('los marcajes son append-only en la base de datos', async () => {
    await expect(ds.query(`UPDATE attendance.punches SET type = 'in'`)).rejects.toThrow(/no se editan/);
    await expect(ds.query(`DELETE FROM attendance.punches`)).rejects.toThrow(/no se borran/);
  });

  it('el supervisor revisa el marcaje y la jornada queda calculada', async () => {
    const pending = await http.get(api('/punches?reviewStatus=pending')).set('Authorization', admin).expect(200);
    expect(pending.body.items).toHaveLength(1);
    expect(pending.body.items[0].employeeName).toBe('Juan Pérez');
    await http.post(api(`/punches/${pending.body.items[0].id}/review`)).set('Authorization', admin).send({ decision: 'approve' }).expect(201);

    const yesterday = new Date(Date.now() - 86_400_000);
    const at = (h: number) => new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), h, 0)).toISOString();
    await http.post(api('/punches/manual')).set('Authorization', admin).send({ employmentId, type: 'in', at: at(15), reason: 'Olvidó checar entrada' }).expect(201);
    await http.post(api('/punches/manual')).set('Authorization', admin).send({ employmentId, type: 'out', at: at(23), reason: 'Olvidó checar salida' }).expect(201);
    const day = yesterday.toISOString().slice(0, 10);
    await http.post(api('/timesheets/recalculate')).set('Authorization', admin).send({ from: day, to: day, employmentId }).expect(201);
    const sheet = await http.get(api(`/timesheets/${employmentId}?from=${day}&to=${day}`)).set('Authorization', admin).expect(200);
    expect(sheet.body.days[0].workedMinutes).toBeGreaterThan(0);
  });

  it('el tablero y el constructor de gráficos responden (incluido el campo personalizado)', async () => {
    const dash = await http.get(api('/analytics/dashboard')).set('Authorization', admin).expect(200);
    expect(dash.body.kpis.activeEmployees).toBe(1);
    expect(dash.body.charts.dailyAttendance).toBeDefined();
    const from = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const chart = await http
      .get(api(`/analytics/chart?from=${from}&to=${to}&metric=worked_hours&dimension=custom_field&customFieldKey=talla`))
      .set('Authorization', admin)
      .expect(200);
    expect(chart.body.series.find((s: { label: string }) => s.label === 'M')).toBeDefined();
  });

  it.each(['pdf', 'xlsx', 'csv'])('genera el registro de jornada en %s', async (format) => {
    const from = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const type = format === 'xlsx' ? 'timesheet' : 'legal_record';
    const job = await http.post(api('/reports')).set('Authorization', admin).send({ type, format, from, to }).expect(201);
    expect(job.body.jobStatus).toBe('done');
    const file = await http.get(api(`/reports/${job.body.id}/download`)).set('Authorization', admin).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    const head = (file.body as Buffer).subarray(0, 4).toString('latin1');
    if (format === 'pdf') expect(head).toBe('%PDF');
    if (format === 'xlsx') expect(head.slice(0, 2)).toBe('PK');
    if (format === 'csv') expect((file.body as Buffer).toString('utf8')).toContain('Inicio de jornada');
  });

  it('kiosco: activación, QR rotativo y marcaje con número + PIN', async () => {
    const kiosk = await http.post(api('/kiosks')).set('Authorization', admin).send({ name: 'Tablet entrada', locationId }).expect(201);
    const activated = await http.post(api('/kiosk/activate')).send({ code: kiosk.body.activationCode }).expect(201);
    const kioskToken = `Bearer ${activated.body.token}`;
    await http.post(api('/kiosk/activate')).send({ code: kiosk.body.activationCode }).expect(400); // un solo uso
    const qr = await http.get(api('/kiosk/qr')).set('Authorization', kioskToken).expect(200);
    expect(qr.body.payload).toMatch(/^att1\.[0-9a-f-]{36}\.\d{8}$/);

    // El empleado escanea el QR: presencia probada sin GPS.
    const viaQr = await http
      .post(api('/me/punches'))
      .set('Authorization', employeeToken)
      .send({ idempotencyKey: `qr-${Date.now()}`, clientAt: new Date().toISOString(), qrPayload: qr.body.payload })
      .expect(201);
    expect(viaQr.body.punch.insideGeofence).toBe(true);
    expect(viaQr.body.punch.deviceId).toBe(kiosk.body.id);

    await http.post(api(`/employees/${employmentId}/kiosk-pin`)).set('Authorization', admin).send({ pin: '4321' }).expect(201);
    await http.post(api('/kiosk/punches')).set('Authorization', kioskToken).send({ employeeNumber: 'E-001', pin: '0000', idempotencyKey: `kp-${Date.now()}`, clientAt: new Date().toISOString() }).expect(401);
    const kp = await http
      .post(api('/kiosk/punches'))
      .set('Authorization', kioskToken)
      .send({ employeeNumber: 'E-001', pin: '4321', idempotencyKey: `kp2-${Date.now()}`, clientAt: new Date().toISOString() })
      .expect(201);
    expect(kp.body.employeeName).toBe('Juan Pérez');
    expect(kp.body.punch.source).toBe('kiosk');
  });

  it('el empleado pide vacaciones y el supervisor las aprueba', async () => {
    const from = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const r = await http.post(api('/me/requests')).set('Authorization', employeeToken).send({ type: 'vacation', fromDate: from, toDate: from }).expect(201);
    await http.post(api('/me/requests')).set('Authorization', employeeToken).send({ type: 'vacation', fromDate: from, toDate: from }).expect(400); // traslape
    const ok = await http.post(api(`/requests/${r.body.id}/approve`)).set('Authorization', admin).send({}).expect(201);
    expect(ok.body.requestStatus).toBe('approved');
    const audit = await http.get(api('/audit?entity=request')).set('Authorization', admin).expect(200);
    expect(audit.body.items.map((a: { action: string }) => a.action)).toEqual(expect.arrayContaining(['create', 'approve']));
  });

  it('importa empleados desde CSV con vista previa y luego los da de alta', async () => {
    const csv = 'Nombre,Apellidos,Teléfono,Número de empleado,Sucursal,Talla de uniforme\nAna,López,5511112222,E-002,Sucursal Centro,G\nLuis,Mora,5533334444,E-003,Sucursal Norte,M\nSin,Talla,5555556666,E-004,,XL\n';
    const preview = await http
      .post(api('/employees/import?dryRun=true'))
      .set('Authorization', admin)
      .attach('file', Buffer.from(csv, 'utf8'), 'empleados.csv')
      .expect(201);
    expect(preview.body).toMatchObject({ dryRun: true, total: 3, ok: 1, failed: 2 });
    expect(preview.body.results[1].errors[0]).toContain('Sucursal «Sucursal Norte» no existe');
    expect(preview.body.results[2].errors[0]).toContain('opción inválida');
    const before = await http.get(api('/employees')).set('Authorization', admin).expect(200);
    const done = await http.post(api('/employees/import')).set('Authorization', admin).attach('file', Buffer.from(csv, 'utf8'), 'empleados.csv').expect(201);
    expect(done.body.ok).toBe(1);
    const after = await http.get(api('/employees')).set('Authorization', admin).expect(200);
    expect(after.body.total).toBe(before.body.total + 1);
    const template = await http.get(api('/employees/import/template')).set('Authorization', admin).expect(200);
    expect(template.headers['content-type']).toContain('spreadsheetml');
  });

  it('el empleado descarga sus datos (derecho de acceso ARCO)', async () => {
    const data = await http.get(api('/me/data-export')).set('Authorization', employeeToken).expect(200);
    expect(data.body.identity.phoneE164).toBe(phoneE164);
    expect(data.body.employments[0].punches.length).toBeGreaterThan(0);
    expect(data.body.employments[0].consents.map((c: { kind: string }) => c.kind)).toContain('geolocation');
  });

  it('anonimiza a quien terminó hace más del plazo de retención', async () => {
    const { RetentionJob } = await import('../src/privacy/jobs');
    const created = await http
      .post(api('/employees'))
      .set('Authorization', admin)
      .send({ identity: { firstName: 'Ex', lastName: 'Empleado', phone: '5577778888' }, employeeNumber: 'E-900', customFields: { talla: 'M' } })
      .expect(201);
    await http.post(api(`/employees/${created.body.id}/terminate`)).set('Authorization', admin).send({ terminationDate: '2015-01-31' }).expect(201);
    expect(await app.get(RetentionJob).execute()).toBe(1);
    const after = await http.get(api(`/employees/${created.body.id}`)).set('Authorization', admin).expect(200);
    expect(after.body.identity).toBeNull(); // identidad anonimizada (estado deleted)
    const [row] = await ds.query(`SELECT "phoneE164", "firstName" FROM attendance.employee_identities WHERE id = $1`, [created.body.identityId]);
    expect(row).toEqual({ phoneE164: null, firstName: 'Anonimizado' });
  });

  it('tablero de grupo: solo las cuentas del mismo usuario con el Checador', async () => {
    const group = await http.get(api('/analytics/group')).set('Authorization', admin).expect(200);
    // seedCoreAccount crea a rosa@espiga.mx en ambas cuentas; solo una tiene el Checador.
    expect(group.body.accounts.map((a: { accountName: string }) => a.accountName)).toEqual(['Panadería La Espiga']);
    expect(group.body.totals.activeEmployees).toBeGreaterThanOrEqual(2);
  });
});
