// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title:       'Airlines Office Map — Global Airline Office Directory',
    description: 'Find airline office locations, contact numbers and working hours worldwide.',
    alternates: {
        canonical: 'https://www.airlinesofficemap.com',
    },
};

export default function HomePage() {
    return (
        <main className="home-page">
            <h1>Welcome to Airlines Office Map</h1>
            <p>Find airline office locations worldwide.</p>
        </main>
    );
}