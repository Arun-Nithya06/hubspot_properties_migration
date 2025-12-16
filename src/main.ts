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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as openapiToPostman from 'openapi-to-postmanv2';

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`Excel to HubSpot Property Creation API (${startCase(nodeEnv)})`)
    .setDescription(
      'Upload Excel files to bulk create or update HubSpot properties across objects (Contacts, Companies, Deals, Tickets). Supports dropdowns, validations, and automatic property group mapping.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-hubspot-api-key',
        in: 'header',
        description: 'HubSpot Private App API Key',
      },
      'hubspot-api-key',
    )
    .setExternalDoc(
      'Click here to download postman collection',
      '/api/v1/doc/json',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/doc', app, document, {
    jsonDocumentUrl: '/api/v1/doc/json',
    swaggerUiEnabled: true,
  });

  // Add redirection to /api/v1/swagger
  const redirectToSwagger = (req: any, res: any, next: any) => {
    if (req.path === '/') res.redirect('/api/v1/doc');
    else next();
  };

  const downloadCollection = (req: any, res: any, next: any) => {
    const collection = new Promise((resolve, reject) => {
      openapiToPostman.convert(
        { type: 'json', data: JSON.stringify(document) },
        { includeAuthInfoInExample: true },
        (err, conversionResult) => {
          if (conversionResult.result) {
            resolve(conversionResult.output[0].data);
          } else {
            reject(err ?? conversionResult.reason);
          }
        },
      );
    });

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename=${'Hubspot Data Bridge API Documentation'?.toLocaleLowerCase().replaceAll(' ', '_')}.json`,
    });

    res.send(collection);
  };

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use('/api/v1', redirectToSwagger);
  app.use('/api', redirectToSwagger);
  app.use('/', redirectToSwagger);
  app.use('/api/v1/collection', downloadCollection);
  await app.listen(port);
}

void bootstrap().then(() =>
  Logger.log(
    `🚀 Express app server running on port ${port} in ${startCase(nodeEnv)} mode`,
  ),
);
