/** Primera vez que una cuenta entra al Checador: los módulos siembran sus valores por defecto. */
export const ACCOUNT_BOOTSTRAPPED_EVENT = 'attendance.account.bootstrapped';

export interface AccountBootstrappedPayload {
  accountId: string;
  timeZone: string;
}
