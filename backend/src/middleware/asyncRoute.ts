/**
 * Express 4 не передаёт ошибки async-обработчиков в error-middleware: запрос повисает,
 * а отклонённый промис может уронить процесс. Обёртка отдаёт ошибку в next().
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncRoute =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };
