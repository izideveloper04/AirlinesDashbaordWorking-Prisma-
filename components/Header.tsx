// components/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">

        {/* Logo */}
        <Link href="/" className="site-logo">
          <div className="logo-icon">✈</div>
          <div className="logo-text">
            Airlines Office Map
            <span>Global Office Directory</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="header-nav">
          <Link href="/">Home</Link>
          <Link href="/airlines">Airlines</Link>
          <Link href="/airports">Airports</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        {/* Search */}
        <div className="header-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search airlines, cities…"
            aria-label="Search"
          />
        </div>

        {/* Mobile toggle */}
        <button className="mobile-menu-btn" aria-label="Open menu">☰</button>

      </div>
    </header>
  );
}