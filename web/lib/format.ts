import type { PublicUser } from './types';

export const DEFAULT_AVATAR = '/assets/images/Avatar.png';

export function fullName(u: Pick<PublicUser, 'firstName' | 'lastName'>): string {
  return `${u.firstName} ${u.lastName}`.trim();
}

export function avatarSrc(u: Pick<PublicUser, 'avatarUrl'>): string {
  return u.avatarUrl || DEFAULT_AVATAR;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
