// components/templates/AirlinesTemplate.tsx
import { WPPage, getAllParentPages } from '@/lib/pages';
import { cleanWordPressContent } from '@/lib/cleanContent';
import Link from 'next/link';

type Props = { page: WPPage };

export default async function AirlinesTemplate({ page }: Props) {
  const children = await getAllParentPages();  // all pages with parent.php template
  const content  = cleanWordPressContent(page.content);

  // Group by first letter (already sorted A→Z from getAllParentPages)
  const grouped = children.reduce<Record<string, WPPage[]>>((acc, child) => {
    const letter = child.title[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(child);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  return (
    <main className="airlines-page">

      {/* Hero banner */}
      <div className="airlines-hero">
        <div className="airlines-hero-inner">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">›</span>
            <span className="current">{page.title}</span>
          </nav>
          <h1 className="airlines-hero-title">{page.title}</h1>
          <p className="airlines-hero-count">
            {children.length} airlines worldwide
          </p>
        </div>
      </div>

      <div className="airlines-body">

        {/* Optional page content */}
        {content && (
          <div
            className="wp-content airlines-intro"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* A–Z letter jump nav */}
        <div className="az-jump-nav">
          {letters.map(letter => (
            <a key={letter} href={`#letter-${letter}`} className="az-jump-link">
              {letter}
            </a>
          ))}
        </div>

        {/* Grouped sections */}
        {letters.map(letter => (
          <section key={letter} id={`letter-${letter}`} className="az-section">

            {/* Letter heading */}
            <div className="az-letter-heading">
              <span className="az-letter">{letter}</span>
              <div className="az-letter-line" />
            </div>

            {/* Cards grid */}
            <div className="airlines-grid">
              {grouped[letter].map(airline => (
                <Link
                  key={airline.id}
                  href={`/${airline.fullPath}`}
                  className="airline-card"
                >
                  <span className="airline-card-title">{airline.title}</span>
                </Link>
              ))}
            </div>

          </section>
        ))}

      </div>
    </main>
  );
}