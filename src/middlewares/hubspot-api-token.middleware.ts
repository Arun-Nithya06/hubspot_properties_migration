import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HubspotApiTokenMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HubspotApiTokenMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction) {
    const apiKey =
      req.headers['x-hubspot-api-key'] || req.headers['X-HubSpot-Api-Key'];

    if (!apiKey) {
      this.logger.warn(
        `Unauthorized access attempt: Missing HubSpot API token`,
      );
      throw new UnauthorizedException(
        'Missing HubSpot API token. Please provide x-hubspot-api-key header.',
      );
    }

    if (typeof apiKey !== 'string') {
      this.logger.warn(
        `Unauthorized access attempt: Invalid HubSpot API token format`,
      );
      throw new UnauthorizedException('Invalid HubSpot API token format.');
    }

    if (!apiKey.startsWith('pat-')) {
      this.logger.warn(
        `Unauthorized access attempt: Token does not start with "pat-"`,
      );
      throw new UnauthorizedException(
        'Invalid HubSpot API token. Token must start with "pat-".',
      );
    }

    if (apiKey.length < 30) {
      this.logger.warn(
        `Unauthorized access attempt: Token length too short (${apiKey.length})`,
      );
      throw new UnauthorizedException(
        'Invalid HubSpot API token. Token length is too short.',
      );
    }
    this.logger.log(`HubSpot API token validated successfully`);

    next();
  }
}
