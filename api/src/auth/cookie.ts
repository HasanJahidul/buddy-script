import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = process.env.COOKIE_NAME ?? 'bs_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function base(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  };
}

export function authCookieOptions(): CookieOptions {
  return { ...base(), maxAge: SEVEN_DAYS_MS };
}

export function clearCookieOptions(): CookieOptions {
  return base();
}
