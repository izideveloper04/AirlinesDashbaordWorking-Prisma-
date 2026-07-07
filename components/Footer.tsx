// components/Footer.tsx
import Link from 'next/link';

const TRUST_ITEMS = [
  {
    label: 'Verified Listings',
    detail: 'Manually checked office data',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M9 12.5 11.2 15 16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 3 4 6.5V11c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
    ),
  },
  {
    label: '200+ Airlines',
    detail: 'Offices across every region',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M10.5 3.5 12 2l1.5 1.5v5.6l6.7 3.9v2.2l-6.7-2.2v4.4l2.2 1.6v1.8L12 19l-3.7 1.2v-1.8l2.2-1.6v-4.4L3.8 15V12.8l6.7-3.9V3.5Z" fill="currentColor" /></svg>
    ),
  },
  {
    label: 'Always Current',
    detail: 'Regularly reviewed & updated',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    ),
  },
  {
    label: 'Direct Contacts',
    detail: 'Phone, email & working hours',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M5 4h3l1.6 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.6v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">

      {/* Trust strip */}
      <div className="footer-trust-strip">
        <div className="footer-trust-inner">
          {TRUST_ITEMS.map(item => (
            <div className="trust-item" key={item.label}>
              <span className="trust-item-icon" aria-hidden="true">{item.icon}</span>
              <div className="trust-item-text">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="site-logo" style={{ display: 'inline-flex' }}>
              <span className="logo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M10.5 3.5 12 2l1.5 1.5v5.6l6.7 3.9v2.2l-6.7-2.2v4.4l2.2 1.6v1.8L12 19l-3.7 1.2v-1.8l2.2-1.6v-4.4L3.8 15V12.8l6.7-3.9V3.5Z" fill="currentColor" />
                </svg>
              </span>
              <span className="logo-text" style={{ color: 'white' }}>
                Airlines Office Map
                <span>Global Office Directory</span>
              </span>
            </Link>
            <p>
              Your trusted directory for airline office locations, contact numbers,
              and working hours across the globe.
            </p>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4>Airlines</h4>
            <ul>
              <li><Link href="/qatar-airways">Qatar Airways</Link></li>
              <li><Link href="/emirates">Emirates</Link></li>
              <li><Link href="/air-india">Air India</Link></li>
              <li><Link href="/indigo">IndiGo</Link></li>
              <li><Link href="/airlines">View All</Link></li>
            </ul>
          </div>

          {/* Regions */}
          <div className="footer-col">
            <h4>Regions</h4>
            <ul>
              <li><Link href="/india">India</Link></li>
              <li><Link href="/middle-east">Middle East</Link></li>
              <li><Link href="/europe">Europe</Link></li>
              <li><Link href="/americas">Americas</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div className="footer-col">
            <h4>Info</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/sitemap.xml">Sitemap</Link></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <span>© {year} Airlines Office Map. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-and-conditions">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
