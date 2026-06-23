// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="site-logo" style={{ display: 'inline-flex' }}>
              <div className="logo-icon">✈</div>
              <div className="logo-text" style={{ color: 'white' }}>
                Airlines Office Map
                <span>Global Office Directory</span>
              </div>
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
          <span>Built for travellers worldwide ✈</span>
        </div>
      </div>
    </footer>
  );
}