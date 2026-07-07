// components/HomeSearch.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const firstLetter = trimmed[0]?.toUpperCase();
    if (firstLetter && /[A-Z]/.test(firstLetter)) {
      router.push(`/airlines#letter-${firstLetter}`);
    } else {
      router.push('/airlines');
    }
  }

  return (
    <form className="hero-search-card" onSubmit={handleSubmit} role="search">
      <span className="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search an airline, e.g. Qatar Airways…"
        aria-label="Search airlines"
      />
      <button type="submit" className="btn btn-gold" style={{ padding: '11px 22px' }}>
        Search
      </button>
    </form>
  );
}
