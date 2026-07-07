// components/templates/ParentTemplate.tsx
import { WPPage, getChildPages } from '@/lib/pages';
import { cleanWordPressContent } from '@/lib/cleanContent';
import Link from 'next/link';
import Image from 'next/image';

type Props = { page: WPPage };

export default async function ParentTemplate({ page }: Props) {
  const children = await getChildPages(page.id);
  const content  = cleanWordPressContent(page.content);

  return (
    <main className="parent-page">

      {/* Hero image or navy banner */}
      {page.featuredImageLocal ? (
        <div className="parent-hero">
            <img
                src={page.featuredImageLocal || page.featuredImage}
                alt={page.featuredImageAlt || page.title}
                style={{ width: '100%', height: '340px', objectFit: 'cover', display: 'block' }}
            />
        </div>
      ) : (
        <div className="parent-hero-banner" />
      )}

      {/* Breadcrumb + title */}
      <div className="parent-page-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <span className="current">{page.title}</span>
        </nav>

        <h1 className="parent-title">{page.title}</h1>
        <div className="gold-rule" style={{ marginBottom: '18px' }} />
        {page.metaDescription&& (
          <p className="parent-subtitle">{page.metaDescription}</p>
        )}
      </div>

      {/* Page content */}
      {content && (
        <div className="parent-content">
          <div className="wp-content" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}

      {/* Child pages grid */}
      {children.length > 0 && (
        <section className="child-grid-section">
          <h2>Browse {page.title}</h2>
          <div className="child-grid">
            {children.map(child => (
              <Link
                key={child.id}
                href={`/${child.fullPath}`}
                className="child-card"
              >
                {child.featuredImageLocal ? (
                  <div className="child-card-image">
                    <Image
                      src={child.featuredImageLocal}
                      alt={child.title}
                      width={300}
                      height={140}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className="child-card-image-placeholder">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M10.5 3.5 12 2l1.5 1.5v5.6l6.7 3.9v2.2l-6.7-2.2v4.4l2.2 1.6v1.8L12 19l-3.7 1.2v-1.8l2.2-1.6v-4.4L3.8 15V12.8l6.7-3.9V3.5Z" fill="currentColor" />
                    </svg>
                  </div>
                )}
                <div className="child-card-body">
                  <h3>{child.title}</h3>
                  <p className="card-meta">{child.slug.replace(/-/g, ' ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}