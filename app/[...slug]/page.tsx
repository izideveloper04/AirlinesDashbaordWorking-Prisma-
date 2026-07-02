// app/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import { getPageByPath, getAllPagePaths, prisma } from '@/lib/pages';
import { getPostPermalinkBase, buildPostUrl } from '@/lib/permalink';
import ParentTemplate from '@/components/templates/ParentTemplate';
import ChildTemplate from '@/components/templates/ChildTemplate';
import AirlinesTemplate from '@/components/templates/AirlinesTemplate';
import PostPageContent from '@/components/PostPageContent';
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

    // Serve posts via catch-all when permalink base is not 'blog'
    // (when it's 'blog', the dedicated app/blog/[slug] route handles posts)
    const permalinkBase = await getPostPermalinkBase();
    if (permalinkBase !== 'blog') {
        let postSlug: string | null = null;
        if (permalinkBase === '' && slug.length === 1) {
            postSlug = slug[0];
        } else if (permalinkBase !== '' && slug.length === 2 && slug[0] === permalinkBase) {
            postSlug = slug[1];
        }

        if (postSlug) {
            const post = await prisma.post.findUnique({
                where:   { slug: postSlug },
                include: {
                    categories: { include: { category: { select: { name: true, slug: true } } } },
                    tags:       { include: { tag:      { select: { name: true, slug: true } } } },
                },
            });
            if (post && post.status === 'published') {
                return <PostPageContent post={post} permalinkBase={permalinkBase} />;
            }
        }
    }

    const page = await getPageByPath(slug);

    if (!page) notFound();

    const isSpecialPage = 
        page.templateFile === 'page-templates/all.php' ||
        page.slug === 'airlines';   // ← add this

    if (!isSpecialPage && page.status !== 'published') notFound();

    // Airlines listing — any page with template 'all'
    if (page.template === 'all') {
        return <AirlinesTemplate page={page} />;
    }

    if (page.template === 'parent' || slug.length === 1) {
        return <ParentTemplate page={page} />;
    }

    return <ChildTemplate page={page} />;
}