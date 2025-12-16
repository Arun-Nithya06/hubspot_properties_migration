import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  /**
   * The function logs request details and response time for a given HTTP request in a TypeScript
   * application.
   * @param {Request} req - Request object containing information about the HTTP request
   * @param {Response} res - The `res` parameter in the code snippet refers to the response object in an
   * Express.js middleware function. This object represents the HTTP response that an Express application
   * sends when it receives an HTTP request. It allows you to send data back to the client, set headers,
   * and end the response.
   * @param {NextFunction} next - The `next` parameter in the code snippet you provided is a function
   * that is used to pass control to the next middleware function in the stack. When called, it tells
   * Express to move on to the next middleware in the chain. This is commonly used in Express middleware
   * functions to pass control from one middleware
   */
  use(req: Request, res: Response, next: NextFunction) {
    const startAt = process.hrtime();
    const { ip, method, originalUrl, body, headers } = req;
    const userAgent = req.get('user-agent') ?? '';

    this.logger.log(`${method} ${originalUrl}`);
    this.logger.debug(`Headers: ${JSON.stringify(headers, null, 2)}`);
    this.logger.debug(`Body: ${JSON.stringify(body)}`);

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      const diff = process.hrtime(startAt);
      const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;

      this.logger.log(`${method} ${originalUrl} ${statusCode} ${responseTime}ms ${contentLength} - ${userAgent} ${ip}`);
    });

    next();
  }
}
