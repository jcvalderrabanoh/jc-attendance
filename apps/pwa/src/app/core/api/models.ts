/** Tipos del contrato con `apps/api` (prefijo /api/v1). */

export type PunchType = 'in' | 'out' | 'break_start' | 'break_end';
export type PresenceState = 'in' | 'out' | 'on_break';
export type PunchReviewStatus = 'auto_ok' | 'pending' | 'approved' | 'rejected';
export type ConsentKind = 'privacy_notice' | 'geolocation' | 'biometric';
export type OtpChannel = 'sms' | 'whatsapp' | 'email';
export type RequestType = 'vacation' | 'permission' | 'sick_leave' | 'punch_correction' | 'overtime';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type WorkdayStatus = 'ok' | 'late' | 'absent' | 'incomplete' | 'holiday' | 'rest' | 'leave';
export type OnboardingReviewStatus = 'pending' | 'needs_info' | 'approved' | 'rejected';

export interface OtpSent {
  destination: string;
  channel: OtpChannel;
  expiresInSeconds: number;
}

export interface EmploymentRef {
  employmentId: string;
  accountId: string;
  onboardingStatus: string;
}

export interface LoginResult {
  token: string;
  identityId: string;
  firstName: string;
  accountId: string | null;
  employmentId: string | null;
  requiresAccountSelection: boolean;
  employments: EmploymentRef[];
}

export interface SelectEmploymentResult {
  token: string;
  accountId: string;
  employmentId: string;
}

export interface Consent {
  id: string;
  kind: ConsentKind;
  version: string;
  grantedAt: string;
  revokedAt?: string | null;
}

export interface MyEmployment extends EmploymentRef {
  accountName: string;
  employeeNumber?: string | null;
  defaultLocationId?: string | null;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'email' | 'phone' | 'curp' | 'rfc';
  options: string[];
  required: boolean;
  validation: { regex?: string; min?: number; max?: number; minLength?: number; maxLength?: number };
  editableByEmployee?: boolean;
}

export interface JoinInfo {
  accountName: string;
  branding: { logoUrl?: string; primaryColor?: string; [k: string]: unknown };
  invitationName: string;
  personal: boolean;
  requiredFields: string[];
  allowedEmailDomains: string[];
  privacyNoticeUrl: string | null;
  privacyNoticeVersion: string;
  customFields: CustomFieldDefinition[];
}

export interface IdentityData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  birthDate?: string;
}

export interface SubmitOnboardingBody {
  identity: IdentityData;
  otpCode: string;
  customFields: Record<string, unknown>;
  consents: ConsentKind[];
}

export interface RuleFinding {
  ruleKey: string;
  outcome: 'pass' | 'warn' | 'fail' | 'info';
  message: string;
}

export interface SubmitOnboardingResult {
  requestId: string;
  reviewStatus: OnboardingReviewStatus;
  token: string;
  findings: RuleFinding[];
}

export interface MyStatus {
  now: string;
  timeZone: string;
  state: PresenceState;
  todayMinutes: number;
  weekMinutes: number;
  perDay: { date: string; minutes: number }[];
  shift: { startTime: string; endTime: string; breakMinutes: number } | null;
  lastPunch: { type: PunchType; at: string; reviewStatus: PunchReviewStatus; riskFlags: string[] } | null;
  defaultLocation: { id: string; name: string; lat: number; lng: number; radiusMeters: number } | null;
  accountName: string | null;
}

export interface Punch {
  id: string;
  type: PunchType;
  source: string;
  effectiveAt: string;
  serverAt: string;
  clientAt: string;
  offline: boolean;
  accuracyMeters?: number | null;
  locationId?: string | null;
  insideGeofence?: boolean | null;
  distanceMeters?: number | null;
  riskFlags: string[];
  reviewStatus: PunchReviewStatus;
  idempotencyKey: string;
}

export interface RegisterPunchBody {
  idempotencyKey: string;
  clientAt: string;
  type?: PunchType;
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
  qrPayload?: string;
  selfieDataUrl?: string;
  offline?: boolean;
}

export interface RegisterPunchResult {
  punch: Punch;
  duplicate: boolean;
  locationName: string | null;
}

export interface Incident {
  id: string;
  type: string;
  status: string;
  date: string;
  detail?: string | null;
}

export interface Workday {
  id: string;
  date: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  firstIn?: string | null;
  lastOut?: string | null;
  workedMinutes: number;
  breakMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: WorkdayStatus;
  isHoliday: boolean;
  isRestDay: boolean;
  hasPendingPunches: boolean;
  incidents?: Incident[];
}

export interface TimesheetTotals {
  workedMinutes: number;
  overtimeDoubleMinutes: number;
  overtimeTripleMinutes: number;
  lateDays: number;
  absences: number;
  incompleteDays: number;
  workedDays: number;
  pendingDays: number;
}

export interface MyTimesheet {
  days: Workday[];
  totals: TimesheetTotals;
}

export interface EmployeeRequest {
  id: string;
  type: RequestType;
  fromDate: string;
  toDate: string;
  payload: Record<string, unknown>;
  comment?: string | null;
  requestStatus: RequestStatus;
  decisionComment?: string | null;
  createdAt: string;
}

export interface CreateRequestBody {
  type: RequestType;
  fromDate: string;
  toDate: string;
  payload?: Record<string, unknown>;
  comment?: string;
}

export interface VacationBalance {
  year: number;
  yearsOfService: number;
  entitled: number;
  taken: number;
  available: number;
}

export interface MyProfile {
  identity: {
    id: string;
    firstName: string;
    lastName: string;
    phoneE164?: string | null;
    email?: string | null;
    curp?: string | null;
    rfc?: string | null;
    nss?: string | null;
    birthDate?: string | null;
  };
  employment: { id: string; employeeNumber?: string | null; hireDate?: string | null; customFields: Record<string, unknown> } | null;
  customFieldDefinitions: CustomFieldDefinition[];
}

export interface MyOnboardingRequest {
  id: string;
  accountId: string;
  accountName: string;
  reviewStatus: OnboardingReviewStatus;
  reviewComment?: string | null;
  createdAt: string;
  findings: RuleFinding[];
}

export interface KioskActivation {
  token: string;
  device: { id: string; name: string; locationId?: string | null };
}

export interface KioskQr {
  payload: string;
  expiresInSeconds: number;
}

export interface KioskPunchBody {
  employeeNumber: string;
  pin: string;
  idempotencyKey: string;
  clientAt: string;
  type?: PunchType;
  selfieDataUrl?: string;
}

export interface KioskPunchResult extends RegisterPunchResult {
  employeeName: string | null;
}
