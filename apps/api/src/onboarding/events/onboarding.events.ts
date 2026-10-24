export const ONBOARDING_SUBMITTED_EVENT = 'attendance.onboarding.submitted';
export const ONBOARDING_DECIDED_EVENT = 'attendance.onboarding.decided';

export interface OnboardingEventPayload {
  accountId: string;
  requestId: string;
  identityId: string | null;
  reviewStatus: string;
  comment?: string | null;
}
