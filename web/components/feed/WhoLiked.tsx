'use client';

import { useState } from 'react';
import { apiGet } from '@/lib/api';
import { avatarSrc, fullName } from '@/lib/format';
import type { Page, PublicUser } from '@/lib/types';

export default function WhoLiked({
  count,
  topLikers,
  likersPath,
}: {
  count: number;
  topLikers: PublicUser[];
  likersPath: string; // e.g. /posts/:id/likers
}) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<PublicUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (count <= 0) return <span />;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !names && !loading) {
      setLoading(true);
      try {
        const page = await apiGet<Page<PublicUser>>(likersPath);
        setNames(page.items);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div className="_feed_inner_timeline_total_reacts_image" onClick={toggle}>
        {topLikers.slice(0, 3).map((u, i) => (
          <img
            key={u.id}
            src={avatarSrc(u)}
            alt={fullName(u)}
            className={i === 0 ? '_react_img1' : '_react_img'}
            width={32}
            height={32}
            style={{ objectFit: 'cover' }}
          />
        ))}
        <p className="_feed_inner_timeline_total_reacts_para">
          {count > 9 ? '9+' : count}
        </p>
      </div>
      {open && (
        <ul className="_who_liked_pop">
          {loading && <li>Loading…</li>}
          {!loading &&
            names?.map((u) => <li key={u.id}>{fullName(u)}</li>)}
          {!loading && names && count > names.length && <li>…and more</li>}
        </ul>
      )}
    </div>
  );
}
