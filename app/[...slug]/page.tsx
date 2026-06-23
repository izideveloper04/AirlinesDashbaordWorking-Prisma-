// app/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import { getPageByPath, getAllPagePaths } from '@/lib/pages';
import ParentTemplate from '@/components/templates/ParentTemplate';
import ChildTemplate from '@/components/templates/ChildTemplate';
import AirlinesTemplate from '@/components/templates/AirlinesTemplate';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  const paths = await getAllPagePaths();  // ← add await
  return paths.filter(p => p.params.slug.join('/') !== '');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const page = await getPageByPath(slug);
    if (!page) return {};

    return {
        title:       page.metaTitle || page.title,
        description: page.metaDescription,        // ← was missing
        alternates: {
            canonical: `https://www.airlinesofficemap.com/${page.fullPath}`,
        },
        openGraph: {
            title:       page.metaTitle || page.title,
            description: page.metaDescription,
            url:         `https://www.airlinesofficemap.com/${page.fullPath}`,
            images:      page.featuredImageLocal
                ? [{ url: `https://www.airlinesofficemap.com${page.featuredImageLocal}`, alt: page.featuredImageAlt || page.title }]
                : page.featuredImage
                ? [{ url: page.featuredImage, alt: page.featuredImageAlt || page.title }]
                : [],
        },
        twitter: {
            card:        'summary_large_image',
            title:       page.metaTitle || page.title,
            description: page.metaDescription,
            images:      page.featuredImageLocal
                ? [`https://www.airlinesofficemap.com${page.featuredImageLocal}`]
                : [],
        },
    };
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPageByPath(slug);

  if (!page) notFound();

  // ── Special template files get their own components ──
  if (page.templateFile === 'page-templates/all.php') {
    return <AirlinesTemplate page={page} />;
  }

  // ── Standard routing by template field ──
  // parent.php → ParentTemplate  (domain.com/qatar-airways)
  // child.php  → ChildTemplate   (domain.com/qatar-airways/london-office)
  if (page.template === 'parent' || slug.length === 1) {
    return <ParentTemplate page={page} />;
  }

  return <ChildTemplate page={page} />;
}