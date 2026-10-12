import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const safeRequestId = /^[A-Za-z0-9._:-]{8,128}$/;

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const requestId = incoming && safeRequestId.test(incoming) ? incoming : randomUUID();
  req.requestId = requestId;
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
