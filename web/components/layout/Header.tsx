'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { avatarSrc, fullName } from '@/lib/format';
import type { AuthUser } from '@/lib/types';

export default function Header({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    try {
      await apiPost('/auth/logout');
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
      <div className="container _custom_container">
        <div className="_logo_wrap">
          <Link className="navbar-brand" href="/feed">
            <img src="/assets/images/logo.svg" alt="Buddy Script" className="_nav_logo" />
          </Link>
        </div>

        <div className="collapse navbar-collapse show">
          <div className="_header_form ms-auto">
            <form className="_header_form_grp" onSubmit={(e) => e.preventDefault()}>
              <svg
                className="_header_form_svg"
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                fill="none"
                viewBox="0 0 17 17"
              >
                <circle cx="7" cy="7" r="6" stroke="#666" />
                <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3" />
              </svg>
              <input
                className="form-control me-2 _inpt1"
                type="search"
                placeholder="input search text"
                aria-label="Search"
              />
            </form>
          </div>

          <ul className="navbar-nav mb-2 mb-lg-0 _header_nav_list ms-auto _mar_r8">
            <li className="nav-item _header_nav_item">
              <Link
                className="nav-link _header_nav_link_active _header_nav_link"
                href="/feed"
                aria-current="page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" fill="none" viewBox="0 0 18 21">
                  <path className="_home_active" stroke="#000" strokeWidth="1.5" strokeOpacity=".6" d="M1 9.924c0-1.552 0-2.328.314-3.01.313-.682.902-1.187 2.08-2.196l1.143-.98C6.667 1.913 7.732 1 9 1c1.268 0 2.333.913 4.463 2.738l1.142.98c1.179 1.01 1.768 1.514 2.081 2.196.314.682.314 1.458.314 3.01v4.846c0 2.155 0 3.233-.67 3.902-.669.67-1.746.67-3.901.67H5.57c-2.155 0-3.232 0-3.902-.67C1 18.002 1 16.925 1 14.77V9.924z" />
                  <path className="_home_active" stroke="#000" strokeOpacity=".6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.857 19.341v-5.857a1 1 0 00-1-1H7.143a1 1 0 00-1 1v5.857" />
                </svg>
              </Link>
            </li>
            <li className="nav-item _header_nav_item">
              <span className="nav-link _header_nav_link">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="20" fill="none" viewBox="0 0 26 20">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M12.79 12.15h.429c2.268.015 7.45.243 7.45 3.732 0 3.466-5.002 3.692-7.415 3.707h-.894c-2.268-.015-7.452-.243-7.452-3.727 0-3.47 5.184-3.697 7.452-3.711l.297-.001h.132zm0 1.75c-2.792 0-6.12.34-6.12 1.962 0 1.585 3.13 1.955 5.864 1.976l.255.002c2.792 0 6.118-.34 6.118-1.958 0-1.638-3.326-1.982-6.118-1.982zM12.789 0c2.96 0 5.368 2.392 5.368 5.33 0 2.94-2.407 5.331-5.368 5.331h-.031a5.329 5.329 0 01-3.782-1.57 5.253 5.253 0 01-1.553-3.764C7.423 2.392 9.83 0 12.789 0z" clipRule="evenodd" />
                </svg>
              </span>
            </li>
            <li className="nav-item _header_nav_item">
              <span className="nav-link _header_nav_link _header_notify_btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0z" clipRule="evenodd" />
                </svg>
                <span className="_counting">3</span>
              </span>
            </li>
          </ul>

          <div className="_header_nav_profile" style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src={avatarSrc(user)}
                alt={fullName(user)}
                width={38}
                height={38}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontWeight: 500, color: '#333' }}>
                {fullName(user)}
              </span>
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 48,
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  minWidth: 160,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontWeight: 500,
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
