/**
 * Авторизация админки: пароль из .env → подписанный HMAC-токен в httpOnly-cookie.
 * Отдельная JWT-библиотека здесь избыточна, node:crypto закрывает задачу.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { clientIp } from './rateLimit.js';

export const ADMIN_COOKIE = 'orbit_admin';

function sign(payload: string): string {
  return createHmac('sha256', config.admin.secret).update(payload).digest('hex');
}

/** Сравнение постоянного времени: защищает и пароль, и подпись токена. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(input: string): boolean {
  if (!config.admin.password) return false;
  return safeEqual(input, config.admin.password);
}

export function issueToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + config.admin.sessionTtlMs }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token || !config.admin.secret) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp: number };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.isProd,
    maxAge: config.admin.sessionTtlMs,
    path: '/',
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (verifyToken(req.cookies?.[ADMIN_COOKIE])) {
    next();
    return;
  }
  res.status(401).json({ error: 'Требуется вход в админку' });
}

/** Троттлинг подбора пароля: 5 попыток на IP за 15 минут. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 5;

export function loginThrottleCheck(req: Request): { blocked: boolean; retryAfter: number } {
  const bucket = attempts.get(clientIp(req));
  if (!bucket || bucket.resetAt <= Date.now()) return { blocked: false, retryAfter: 0 };
  if (bucket.count < LOGIN_MAX) return { blocked: false, retryAfter: 0 };
  return { blocked: true, retryAfter: Math.ceil((bucket.resetAt - Date.now()) / 1000) };
}

export function registerFailedLogin(req: Request): void {
  const key = clientIp(req);
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function clearLoginAttempts(req: Request): void {
  attempts.delete(clientIp(req));
}
