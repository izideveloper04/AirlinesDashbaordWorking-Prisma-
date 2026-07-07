// app/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, getAllParentPages, getChildPages } from '@/lib/pages';
import HomeSearch from '@/components/HomeSearch';

export const metadata: Metadata = {
    title:       'Airlines Office Map — Global Airline Office Directory',
    description: 'Find airline office locations, contact numbers and working hours worldwide.',
    alternates: {
        canonical: 'https://www.airlinesofficemap.com',
    },
};

// Rendered on-demand so newly published pages/offices appear immediately.
export const dynamic = 'force-dynamic';

const REGION_SLUGS = ['india', 'middle-east', 'europe', 'americas'];

export default async function HomePage() {
    const [allAirlines, officeCount, regionPages] = await Promise.all([
        getAllParentPages(),
        prisma.page.count({ where: { status: 'published', template: 'child' } }),
        prisma.page.findMany({ where: { slug: { in: REGION_SLUGS }, status: 'published' } }),
    ]);

    const popularAirlines = allAirlines.slice(0, 12);

    const regions = await Promise.all(
        regionPages.map(async region => ({
            page:  region,
            count: (await getChildPages(region.id)).length,
        }))
    );

    return (
        <main className="home-page">

            {/* Hero */}
            <section className="home-hero">
                <svg className="home-hero-flightpath" viewBox="0 0 300 220" fill="none" aria-hidden="true">
                    <path
                        d="M10 200 C 90 210, 160 120, 180 70 S 260 10, 290 15"
                        stroke="rgba(224,172,63,0.55)"
                        strokeWidth="1.5"
                        strokeDasharray="2 8"
                        strokeLinecap="round"
                    />
                    <g transform="translate(275,10) rotate(35)">
                        <path d="M0 6 8 3l7 1-7 3 1 6-3-1-2-6-6 2Z" fill="#E0AC3F" />
                    </g>
                    <circle cx="10" cy="200" r="3" fill="#E0AC3F" />
                </svg>

                <div className="home-hero-inner">
                    <div className="home-hero-content">
                        <span className="eyebrow">
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                <path d="M10.5 3.5 12 2l1.5 1.5v5.6l6.7 3.9v2.2l-6.7-2.2v4.4l2.2 1.6v1.8L12 19l-3.7 1.2v-1.8l2.2-1.6v-4.4L3.8 15V12.8l6.7-3.9V3.5Z" fill="currentColor" />
                            </svg>
                            Global Office Directory
                        </span>
                        <h1 className="home-hero-title">
                            Every airline office,<br />find it <em>in seconds</em>.
                        </h1>
                        <p className="home-hero-sub">
                            Verified addresses, direct phone numbers, and working hours for airline
                            offices worldwide — organised by airline, country, and city.
                        </p>

                        <div className="home-hero-actions">
                            <HomeSearch />
                        </div>

                        <div className="hero-stats">
                            <div className="hero-stat">
                                <strong>{allAirlines.length}+</strong>
                                <span>Airlines Listed</span>
                            </div>
                            <div className="hero-stat">
                                <strong>{officeCount}+</strong>
                                <span>Office Locations</span>
                            </div>
                            <div className="hero-stat">
                                <strong>{regions.length || REGION_SLUGS.length}</strong>
                                <span>Regions Covered</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular airlines */}
            {popularAirlines.length > 0 && (
                <section className="home-section">
                    <div className="home-section-head">
                        <div>
                            <span className="eyebrow">Popular</span>
                            <h2>Browse airlines A–Z</h2>
                            <p>Jump straight to an airline&apos;s office directory.</p>
                        </div>
                        <Link href="/airlines" className="home-section-link">
                            View all airlines
                            <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </Link>
                    </div>
                    <div className="home-airlines-grid">
                        {popularAirlines.map(airline => (
                            <Link key={airline.id} href={`/${airline.fullPath}`} className="airline-card">
                                <span className="airline-card-title">{airline.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Regions */}
            {regions.length > 0 && (
                <section className="home-section">
                    <div className="home-section-head">
                        <div>
                            <span className="eyebrow">Explore</span>
                            <h2>Browse by region</h2>
                            <p>Find airline offices grouped by country and region.</p>
                        </div>
                    </div>
                    <div className="home-regions">
                        {regions.map(({ page, count }) => (
                            <Link key={page.id} href={`/${page.fullPath}`} className="region-card">
                                <div>
                                    <div className="region-card-label">{page.title}</div>
                                    <div className="region-card-count">{count} listing{count !== 1 ? 's' : ''}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* How it works */}
            <section className="home-section">
                <div className="home-section-head">
                    <div>
                        <span className="eyebrow">How it works</span>
                        <h2>Three steps to the office you need</h2>
                    </div>
                </div>
                <div className="home-howit">
                    <div className="howit-card">
                        <div className="howit-num">01</div>
                        <h3>Find your airline</h3>
                        <p>Search or browse our A–Z list of airlines from around the world.</p>
                    </div>
                    <div className="howit-card">
                        <div className="howit-num">02</div>
                        <h3>Pick a city</h3>
                        <p>Every airline lists its office locations by country and city.</p>
                    </div>
                    <div className="howit-card">
                        <div className="howit-num">03</div>
                        <h3>Get in touch</h3>
                        <p>View the verified address, phone number, and working hours.</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <div className="home-cta">
                <div className="home-cta-inner">
                    <div>
                        <h2>Can&apos;t find an office?</h2>
                        <p>Let us know and we&apos;ll get it added to the directory.</p>
                    </div>
                    <Link href="/contact" className="btn btn-gold">Contact Us</Link>
                </div>
            </div>
        </main>
    );
}
