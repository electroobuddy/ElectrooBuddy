import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';

export function httpLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId: (req) => {
      const candidate = req.headers['x-request-id'];
      const requestId = Array.isArray(candidate) ? candidate[0] : candidate;
      return typeof requestId === 'string' && requestId.length > 0 ? requestId : randomUUID();
    },
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
