import { EMPTY_KEYPAD, KeypadState, canSubmit, pressKey } from './kiosk.logic';

const type = (keys: string[], from: KeypadState = EMPTY_KEYPAD) => keys.reduce(pressKey, from);

describe('teclado del kiosco', () => {
  it('número de empleado → OK → PIN', () => {
    const s = type(['1', '2', '3', 'ok', '4', '5', '6', '7']);
    expect(s).toEqual({ step: 'pin', employeeNumber: '123', pin: '4567' });
    expect(canSubmit(s)).toBe(true);
  });

  it('OK sin número no avanza; PIN de menos de 4 no se puede enviar', () => {
    expect(type(['ok']).step).toBe('number');
    expect(canSubmit(type(['1', 'ok', '1', '2', '3']))).toBe(false);
  });

  it('borrar: en el PIN vacío regresa al número', () => {
    const s = type(['9', 'ok', '1', 'back', 'back']);
    expect(s).toEqual({ step: 'number', employeeNumber: '9', pin: '' });
    expect(type(['back'], s).employeeNumber).toBe('');
  });

  it('PIN máximo 6 dígitos e ignora teclas no numéricas', () => {
    const s = type(['7', 'ok', ...'12345678'.split(''), 'x']);
    expect(s.pin).toBe('123456');
    expect(type(['clear'], s)).toEqual(EMPTY_KEYPAD);
  });
});
