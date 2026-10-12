import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';

export function httpLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id']?.toString(),
    customProps: (req) => ({ requestId: req.id }),
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url, remoteAddress: req.remoteAddress };
      },
      res(res) {
        return { statusCode: res.statusCode };
      }
    }
  });
}
