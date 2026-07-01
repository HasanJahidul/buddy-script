'use client';

import { useState } from 'react';
import type { Visibility } from '@/lib/types';

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export default function PrivacyDropdown({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  const [open, setOpen] = useState(false);
  const isPublic = value === 'PUBLIC';

  function choose(v: Visibility) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="_composer_privacy">
      <button
        type="button"
        className="_composer_privacy_btn"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="_composer_privacy_ic">
          {isPublic ? <GlobeIcon /> : <LockIcon />}
        </span>
        <span>{isPublic ? 'Public' : 'Private'}</span>
        <span className="_composer_privacy_caret">▾</span>
      </button>
      {open && (
        <ul className="_composer_privacy_menu">
          <li className={isPublic ? '_active' : ''} onClick={() => choose('PUBLIC')}>
            <span className="_composer_privacy_ic">
              <GlobeIcon />
            </span>
            <div>
              <strong>Public</strong>
              <small>Anyone can see this post</small>
            </div>
          </li>
          <li className={!isPublic ? '_active' : ''} onClick={() => choose('PRIVATE')}>
            <span className="_composer_privacy_ic">
              <LockIcon />
            </span>
            <div>
              <strong>Private</strong>
              <small>Only you can see this post</small>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}
