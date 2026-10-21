import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap-app';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = new DocumentBuilder()
    .setTitle('Checador API (jc-attendance)')
    .setDescription('Registro de entradas y salidas multicuenta')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  const port = parseInt(process.env.PORT || '3100', 10);
  await app.listen(port);
  Logger.log(`jc-attendance escuchando en :${port}`, 'Bootstrap');
}
bootstrap();
