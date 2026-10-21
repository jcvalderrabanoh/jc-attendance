/** Estado del teclado del kiosco: número de empleado → PIN. */
export interface KeypadState {
  step: 'number' | 'pin';
  employeeNumber: string;
  pin: string;
}

export const EMPTY_KEYPAD: KeypadState = { step: 'number', employeeNumber: '', pin: '' };

export function pressKey(s: KeypadState, key: string): KeypadState {
  if (key === 'back') {
    if (s.step === 'pin') return s.pin ? { ...s, pin: s.pin.slice(0, -1) } : { ...s, step: 'number' };
    return { ...s, employeeNumber: s.employeeNumber.slice(0, -1) };
  }
  if (key === 'clear') return EMPTY_KEYPAD;
  if (key === 'ok') {
    if (s.step === 'number' && s.employeeNumber) return { ...s, step: 'pin' };
    return s;
  }
  if (!/^\d$/.test(key)) return s;
  if (s.step === 'number') return s.employeeNumber.length >= 12 ? s : { ...s, employeeNumber: s.employeeNumber + key };
  return s.pin.length >= 6 ? s : { ...s, pin: s.pin + key };
}

export function canSubmit(s: KeypadState): boolean {
  return s.step === 'pin' && /^\d{4,6}$/.test(s.pin) && s.employeeNumber.length > 0;
}
