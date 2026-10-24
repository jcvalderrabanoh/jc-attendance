import { Component, ElementRef, effect, input, model, output, viewChildren } from '@angular/core';

/** 6 casillas para el código OTP. Acepta pegar y el autollenado de SMS (one-time-code). */
@Component({
  selector: 'att-otp-input',
  template: `
    <div class="boxes" role="group" [attr.aria-label]="label()">
      @for (i of slots; track i) {
        <input
          #box
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          [attr.autocomplete]="i === 0 ? 'one-time-code' : 'off'"
          [attr.aria-label]="'Dígito ' + (i + 1) + ' de 6'"
          [value]="digits()[i] || ''"
          [disabled]="disabled()"
          (input)="onInput(i, $event)"
          (keydown)="onKeydown(i, $event)"
          (paste)="onPaste($event)"
          (focus)="box.select()"
        />
      }
    </div>
  `,
  styles: `
    .boxes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
    input {
      width: 100%; min-width: 0; height: 56px; text-align: center;
      font: 700 1.5rem Inter, sans-serif; color: var(--att-ink);
      border: 1.5px solid #b8c7cc; border-radius: 12px; background: #fff;
    }
    input:focus { outline: none; border-color: var(--att-primary); box-shadow: 0 0 0 3px rgb(15 76 92 / 18%); }
  `,
})
export class OtpInputComponent {
  readonly value = model<string>('');
  readonly disabled = input(false);
  readonly label = input('Código de 6 dígitos');
  readonly completed = output<string>();
  readonly slots = [0, 1, 2, 3, 4, 5];
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');

  digits(): string[] {
    return this.value().split('');
  }

  constructor() {
    effect(() => {
      if (this.value() === '') this.boxes()[0]?.nativeElement.focus();
    });
  }

  private set(next: string, focusIndex: number): void {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    this.value.set(clean);
    const target = this.boxes()[Math.min(focusIndex, 5)];
    target?.nativeElement.focus();
    if (clean.length === 6) this.completed.emit(clean);
  }

  onInput(i: number, event: Event): void {
    const el = event.target as HTMLInputElement;
    const cur = this.value();
    const typed = el.value.replace(/\D/g, '');
    if (typed.length > 1) {
      // Autollenado del sistema: llega el código completo en una casilla.
      this.set(typed, typed.length);
      return;
    }
    if (!typed) {
      if (el.value) {
        el.value = cur[i] ?? ''; // tecla no numérica: se ignora
        return;
      }
      this.set(cur.slice(0, i) + cur.slice(i + 1), i);
      return;
    }
    this.set((cur.slice(0, i) + typed + cur.slice(i + 1)).slice(0, 6), Math.min(i, cur.length) + 1);
  }

  onKeydown(i: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[i] && i > 0) {
      event.preventDefault();
      this.set(this.value().slice(0, i - 1), i - 1);
    } else if (event.key === 'ArrowLeft' && i > 0) {
      this.boxes()[i - 1].nativeElement.focus();
    } else if (event.key === 'ArrowRight' && i < 5) {
      this.boxes()[i + 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/\d/.test(text)) return;
    event.preventDefault();
    const digits = text.replace(/\D/g, '');
    this.set(digits, digits.length);
  }
}
