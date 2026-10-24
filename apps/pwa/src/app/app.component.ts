import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PunchService } from './core/punch/punch.service';

@Component({
  selector: 'att-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private readonly punches = inject(PunchService);

  ngOnInit(): void {
    // Vacía la cola offline al abrir la app (iOS no tiene Background Sync).
    this.punches.start();
  }
}
