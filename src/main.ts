import { NestFactory } from '@nestjs/core';

import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { startCase } from 'lodash';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

const port = process.env.PORT ?? 3000;
const nodeEnv = process.env.NODE_ENV ?? 'dev';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(';')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
  });

  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  app.setGlobalPrefix('api/v1');

  app.use(helmet());
  app.use(cookieParser());
  app.disable('x-powered-by');
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
}

void bootstrap().then(() =>
  Logger.log(
    `🚀 Express app server running on port ${port} in ${startCase(nodeEnv)} mode`,
  ),
);
