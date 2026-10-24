import { Routes } from '@angular/router';
import { employeeGuard, employmentGuard, guestGuard, kioskGuard } from './core/auth/guards';

export const routes: Routes = [
  // Públicas
  { path: 'unirse/:token', title: 'Alta · Checador', loadComponent: () => import('./pages/join/join.page').then((m) => m.JoinPage) },
  { path: 'entrar', title: 'Entrar · Checador', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },

  // Kiosco (tablet de la sucursal)
  { path: 'kiosco/activar', title: 'Activar kiosco', loadComponent: () => import('./pages/kiosk/kiosk-activate.page').then((m) => m.KioskActivatePage) },
  { path: 'kiosco', title: 'Kiosco · Checador', canActivate: [kioskGuard], loadComponent: () => import('./pages/kiosk/kiosk.page').then((m) => m.KioskPage) },

  // Empleado con sesión
  { path: 'cuentas', title: 'Mis empresas · Checador', canActivate: [employeeGuard], loadComponent: () => import('./pages/accounts/accounts.page').then((m) => m.AccountsPage) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', title: 'Checar', canActivate: [employmentGuard], loadComponent: () => import('./pages/check/check.page').then((m) => m.CheckPage) },
      { path: 'historial', title: 'Historial · Checador', canActivate: [employmentGuard], loadComponent: () => import('./pages/history/history.page').then((m) => m.HistoryPage) },
      { path: 'solicitudes', title: 'Solicitudes · Checador', canActivate: [employmentGuard], loadComponent: () => import('./pages/requests/requests.page').then((m) => m.RequestsPage) },
      { path: 'perfil', title: 'Perfil · Checador', canActivate: [employeeGuard], loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
