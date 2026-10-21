import { Component, input } from '@angular/core';

/** Ícono decorativo de Material Symbols (siempre acompañado de texto). */
@Component({
  selector: 'att-icon',
  template: `<span class="material-symbols-outlined" aria-hidden="true" [style.font-size.px]="size()" [style.font-variation-settings]="fill() ? &quot;'FILL' 1&quot; : null">{{ name() }}</span>`,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(24);
  readonly fill = input<boolean>(false);
}
