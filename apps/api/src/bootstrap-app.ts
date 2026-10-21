import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Configuración común de la app (main.ts y pruebas e2e). */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.enableCors({ origin: (process.env.CORS_ORIGINS || '*').split(','), credentials: true });
  return app;
}
