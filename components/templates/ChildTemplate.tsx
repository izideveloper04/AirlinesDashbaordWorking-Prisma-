// components/templates/ChildTemplate.tsx
import { WPPage, getSiblingPages, getParentPage } from '@/lib/pages';
import { cleanWordPressContent } from '@/lib/cleanContent';
import ChildPagesSidebar from '@/components/sidebar/ChildPagesSidebar';
import Image from 'next/image';
import Link from 'next/link';

type Props = { page: WPPage };

export default async function ChildTemplate({ page }: Props) {
  const siblings = await getSiblingPages(page);
  const parent   = await getParentPage(page.parentId);
  const content  = cleanWordPressContent(page.content);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="page-wrapper">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          {parent && (
            <>
              <Link href={`/${parent.fullPath}`}>{parent.title}</Link>
              <span className="sep">›</span>
            </>
          )}
          <span className="current">{page.title}</span>
        </nav>
      </div>

      {/* Main layout */}
      <div className="child-page-layout">

        {/* Sidebar */}
        <aside className="child-sidebar-wrap">
          <ChildPagesSidebar
            siblings={siblings}
            parent={parent}
            currentPageId={page.id}
          />
        </aside>

        {/* Content */}
        <main className="child-page-main">

          {page.featuredImageLocal && (
            <div className="child-hero">
                <img
                    src={page.featuredImageLocal || page.featuredImage}
                    alt={page.featuredImageAlt || page.title}
                    style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
                />
            </div>
          )}

          <h1 className="child-title">{page.title}</h1>

          {content && (
            <div
              className="wp-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

        </main>
      </div>
    </div>
  );
}