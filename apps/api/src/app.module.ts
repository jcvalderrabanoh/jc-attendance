import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit';
import { buildDataSourceOptions } from './config';
import { CoreLinkModule } from './core-link';
import { HealthController } from './health.controller';
import { LocationsModule } from './locations';
import { OrganizationModule } from './organization';
import { CustomFieldsModule } from './custom-fields';
import { SchedulesModule } from './schedules';
import { EmployeesModule } from './employees';
import { EmployeeAuthModule } from './employee-auth';
import { OnboardingModule } from './onboarding';
import { PunchesModule } from './punches';
import { TimesheetsModule } from './timesheets';
import { RequestsModule } from './requests';
import { AnalyticsModule } from './analytics';
import { ReportsModule } from './reports';
import { NotificationsModule } from './notifications';
import { PrivacyModule } from './privacy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    // Colas propias con prefijo `att` en el mismo Redis que jc-core.
    BullModule.forRoot({
      redis: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379', 10), password: process.env.REDIS_PASSWORD || undefined },
      prefix: 'att',
    }),
    // Límite global; los endpoints públicos (liga, OTP, kiosco) llevan uno más estricto.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    CoreLinkModule,
    AuditModule,
    OrganizationModule,
    LocationsModule,
    CustomFieldsModule,
    SchedulesModule,
    EmployeesModule,
    EmployeeAuthModule,
    OnboardingModule,
    PunchesModule,
    TimesheetsModule,
    RequestsModule,
    AnalyticsModule,
    ReportsModule,
    NotificationsModule,
    PrivacyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
