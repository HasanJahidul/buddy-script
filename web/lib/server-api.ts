import { cookies } from 'next/headers';
import type { AuthUser, Page, PostDto } from './types';

// Server-side API helpers used by server components. These call the NestJS API
// directly (not through the browser proxy) and forward the incoming cookies.

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

async function serverGet<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const data = await serverGet<{ user: AuthUser }>('/auth/me');
  return data?.user ?? null;
}

export async function getInitialFeed(): Promise<Page<PostDto> | null> {
  return serverGet<Page<PostDto>>('/posts?limit=10');
}
