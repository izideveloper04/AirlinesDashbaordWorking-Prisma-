// components/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/airlines', label: 'Airlines' },
  { href: '/airports', label: 'Airports' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="top-bar-tagline">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
            </svg>
            <span>Verified office data for 200+ airlines worldwide</span>
          </div>
          <nav className="top-bar-links">
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </div>

      <header className="site-header">
        <div className="header-inner">

          <Link href="/" className="site-logo">
            <span className="logo-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.5 3.5 12 2l1.5 1.5v5.6l6.7 3.9v2.2l-6.7-2.2v4.4l2.2 1.6v1.8L12 19l-3.7 1.2v-1.8l2.2-1.6v-4.4L3.8 15V12.8l6.7-3.9V3.5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="logo-text">
              Airlines Office Map
              <span>Global Office Directory</span>
            </span>
          </Link>

          <nav className="header-nav" aria-label="Primary">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>

          <div className="header-search">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search airlines, cities…"
              aria-label="Search airlines and cities"
            />
          </div>

          <button
            className="mobile-menu-btn"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(open => !open)}
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            )}
          </button>

        </div>

        {mobileOpen && (
          <div className="mobile-nav-panel">
            <nav aria-label="Mobile">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mobile-nav-search">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input type="text" placeholder="Search airlines, cities…" aria-label="Search airlines and cities" />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
