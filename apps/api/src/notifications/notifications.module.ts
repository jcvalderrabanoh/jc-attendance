import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees';
import { OrganizationModule } from '../organization';
import { NotificationsListener } from './listeners';
import { NotifyEmployeeProcess } from './processes';
import { notificationSenderProvider } from './providers';

/** Avisos al empleado por eventos de otros módulos (pub/sub, sin acoplamiento). */
@Module({
  imports: [EmployeesModule, OrganizationModule],
  providers: [notificationSenderProvider, NotifyEmployeeProcess, NotificationsListener],
})
export class NotificationsModule {}
