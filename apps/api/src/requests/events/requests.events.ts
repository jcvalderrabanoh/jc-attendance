export const REQUEST_DECIDED_EVENT = 'attendance.request.decided';

export interface RequestDecidedPayload {
  accountId: string;
  requestId: string;
  employmentId: string;
  fromDate: string;
  toDate: string;
  approved: boolean;
}
