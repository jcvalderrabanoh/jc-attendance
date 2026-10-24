export const EMPLOYEE_ACTIVATED_EVENT = 'attendance.employee.activated';
export const EMPLOYEE_TERMINATED_EVENT = 'attendance.employee.terminated';

export interface EmployeeEventPayload {
  accountId: string;
  employmentId: string;
  identityId: string;
}
