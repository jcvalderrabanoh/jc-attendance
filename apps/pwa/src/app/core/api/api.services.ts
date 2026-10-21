import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Consent,
  ConsentKind,
  CreateRequestBody,
  EmployeeRequest,
  JoinInfo,
  KioskActivation,
  KioskPunchBody,
  KioskPunchResult,
  KioskQr,
  LoginResult,
  MyEmployment,
  MyOnboardingRequest,
  MyProfile,
  MyStatus,
  MyTimesheet,
  OtpChannel,
  OtpSent,
  Punch,
  RegisterPunchBody,
  RegisterPunchResult,
  SelectEmploymentResult,
  SubmitOnboardingBody,
  SubmitOnboardingResult,
  VacationBalance,
} from './models';

export const API_URL = environment.apiUrl;

/** /employee-auth: OTP, selección de patrón y consentimientos. */
@Injectable({ providedIn: 'root' })
export class EmployeeAuthApi {
  private readonly http = inject(HttpClient);

  requestOtp(destination: string, channel?: OtpChannel): Observable<OtpSent> {
    return this.http.post<OtpSent>(`${API_URL}/employee-auth/otp`, channel ? { destination, channel } : { destination });
  }
  verify(destination: string, code: string): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${API_URL}/employee-auth/verify`, { destination, code });
  }
  selectEmployment(employmentId: string): Observable<SelectEmploymentResult> {
    return this.http.post<SelectEmploymentResult>(`${API_URL}/employee-auth/select-employment`, { employmentId });
  }
  consents(): Observable<Consent[]> {
    return this.http.get<Consent[]>(`${API_URL}/employee-auth/consents`);
  }
  grant(kinds: ConsentKind[]): Observable<Consent[]> {
    return this.http.post<Consent[]>(`${API_URL}/employee-auth/consents`, { kinds });
  }
  revoke(kind: ConsentKind): Observable<Consent[]> {
    return this.http.post<Consent[]>(`${API_URL}/employee-auth/consents/revoke`, { kind });
  }
}

/** /join/:token: alta por liga (público). */
@Injectable({ providedIn: 'root' })
export class JoinApi {
  private readonly http = inject(HttpClient);

  info(token: string): Observable<JoinInfo> {
    return this.http.get<JoinInfo>(`${API_URL}/join/${encodeURIComponent(token)}`);
  }
  requestOtp(token: string, phone: string): Observable<OtpSent> {
    return this.http.post<OtpSent>(`${API_URL}/join/${encodeURIComponent(token)}/otp`, { phone });
  }
  submit(token: string, body: SubmitOnboardingBody): Observable<SubmitOnboardingResult> {
    return this.http.post<SubmitOnboardingResult>(`${API_URL}/join/${encodeURIComponent(token)}`, body);
  }
}

/** /me: todo lo del empleado autenticado. */
@Injectable({ providedIn: 'root' })
export class MeApi {
  private readonly http = inject(HttpClient);

  status(): Observable<MyStatus> {
    return this.http.get<MyStatus>(`${API_URL}/me/status`);
  }
  punch(body: RegisterPunchBody): Observable<RegisterPunchResult> {
    return this.http.post<RegisterPunchResult>(`${API_URL}/me/punches`, body);
  }
  punches(from: string, to: string): Observable<Punch[]> {
    return this.http.get<Punch[]>(`${API_URL}/me/punches`, { params: new HttpParams().set('from', from).set('to', to) });
  }
  timesheet(from: string, to: string): Observable<MyTimesheet> {
    return this.http.get<MyTimesheet>(`${API_URL}/me/timesheet`, { params: new HttpParams().set('from', from).set('to', to) });
  }
  employments(): Observable<MyEmployment[]> {
    return this.http.get<MyEmployment[]>(`${API_URL}/me/employments`);
  }
  profile(): Observable<MyProfile> {
    return this.http.get<MyProfile>(`${API_URL}/me/profile`);
  }
  updateProfile(body: { email?: string; customFields?: Record<string, unknown> }): Observable<MyProfile> {
    return this.http.patch<MyProfile>(`${API_URL}/me/profile`, body);
  }
  onboarding(): Observable<MyOnboardingRequest[]> {
    return this.http.get<MyOnboardingRequest[]>(`${API_URL}/me/onboarding`);
  }
  requests(): Observable<EmployeeRequest[]> {
    return this.http.get<EmployeeRequest[]>(`${API_URL}/me/requests`);
  }
  createRequest(body: CreateRequestBody): Observable<EmployeeRequest> {
    return this.http.post<EmployeeRequest>(`${API_URL}/me/requests`, body);
  }
  cancelRequest(id: string): Observable<EmployeeRequest> {
    return this.http.post<EmployeeRequest>(`${API_URL}/me/requests/${id}/cancel`, {});
  }
  vacationBalance(): Observable<VacationBalance | null> {
    return this.http.get<VacationBalance | null>(`${API_URL}/me/requests/vacation-balance`);
  }
}

/** /kiosk: tablet compartida de la sucursal. */
@Injectable({ providedIn: 'root' })
export class KioskApi {
  private readonly http = inject(HttpClient);

  activate(code: string): Observable<KioskActivation> {
    return this.http.post<KioskActivation>(`${API_URL}/kiosk/activate`, { code });
  }
  qr(): Observable<KioskQr> {
    return this.http.get<KioskQr>(`${API_URL}/kiosk/qr`);
  }
  punch(body: KioskPunchBody): Observable<KioskPunchResult> {
    return this.http.post<KioskPunchResult>(`${API_URL}/kiosk/punches`, body);
  }
}
