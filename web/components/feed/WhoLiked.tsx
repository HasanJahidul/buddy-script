'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [likers, setLikers] = useState<PublicUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (count <= 0) return <span />;

  async function openModal() {
    setOpen(true);
    if (!likers && !loading) {
      setLoading(true);
      try {
        const page = await apiGet<Page<PublicUser>>(`${likersPath}?limit=50`);
        setLikers(page.items);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <>
      <div className="_feed_inner_timeline_total_reacts_image" onClick={openModal}>
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

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="_wl_modal_overlay" onClick={() => setOpen(false)}>
            <div className="_wl_modal" onClick={(e) => e.stopPropagation()}>
              <div className="_wl_modal_head">
                <h4>Liked by {count}</h4>
                <button
                  type="button"
                  className="_wl_modal_close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="_wl_modal_body">
                {loading && <p className="_muted_note">Loading…</p>}
                {!loading &&
                  likers?.map((u) => (
                    <div key={u.id} className="_wl_modal_row">
                      <img
                        src={avatarSrc(u)}
                        alt={fullName(u)}
                        className="_wl_modal_avatar"
                      />
                      <span>{fullName(u)}</span>
                    </div>
                  ))}
                {!loading && likers && count > likers.length && (
                  <p className="_muted_note">…and {count - likers.length} more</p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
