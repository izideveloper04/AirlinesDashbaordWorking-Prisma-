import { prisma } from '@/lib/pages';
import { getPostPermalinkBase, buildPostUrl } from '@/lib/permalink';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

// Rendered on-demand against the live DB (no build-time pre-render) so
// edits made in the CMS go live immediately without a redeploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) return {};
    return {
        title:       `#${tag.name} | Airlines Office Map Blog`,
        description: `All posts tagged with ${tag.name}.`,
    };
}

export default async function TagArchivePage({ params }: Props) {
    const { slug } = await params;

    const tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) notFound();

    const [posts, permalinkBase] = await Promise.all([
        prisma.post.findMany({
            where:   { status: 'published', tags: { some: { tagId: tag.id } } },
            orderBy: { createdAt: 'desc' },
            include: {
                categories: { include: { category: { select: { name: true, slug: true } } } },
                tags:       { include: { tag:      { select: { name: true, slug: true } } } },
            },
        }),
        getPostPermalinkBase(),
    ]);

    return (
        <main className="blog-page">
            <div className="blog-container">

                {/* Breadcrumb */}
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link href="/">Home</Link>
                    <span className="sep">›</span>
                    <Link href="/blog">Blog</Link>
                    <span className="sep">›</span>
                    <span className="current">Tag: {tag.name}</span>
                </nav>

                {/* Hero */}
                <div className="blog-hero">
                    <span className="blog-hero-badge tag"># Tag</span>
                    <h1 className="blog-hero-title">{tag.name}</h1>
                    <p className="blog-hero-sub">{posts.length} post{posts.length !== 1 ? 's' : ''} with this tag</p>
                </div>

                {/* Posts */}
                {posts.length === 0 ? (
                    <div className="blog-empty">No published posts with this tag yet.</div>
                ) : (
                    <div className="blog-grid">
                        {posts.map(post => (
                            <article key={post.id} className="blog-card">
                                {post.featuredImage && (
                                    <Link href={buildPostUrl(post.slug, permalinkBase)}>
                                        <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} className="blog-card-img" />
                                    </Link>
                                )}
                                <div className="blog-card-body">
                                    {post.categories.length > 0 && (
                                        <div className="blog-chip-row">
                                            {post.categories.map(({ category: cat }) => (
                                                <Link key={cat.slug} href={`/category/${cat.slug}`} className="blog-chip">
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    <h2 className="blog-card-title">
                                        <Link href={buildPostUrl(post.slug, permalinkBase)}>{post.title}</Link>
                                    </h2>
                                    {(post.excerpt || post.content) && (
                                        <p className="blog-card-excerpt">
                                            {post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 140) + '…'}
                                        </p>
                                    )}
                                    <div className="blog-card-foot">
                                        <span className="blog-card-date">
                                            {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        <Link href={buildPostUrl(post.slug, permalinkBase)} className="blog-read-more">Read →</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <Link href="/blog" className="blog-back-link">← All Posts</Link>
            </div>
        </main>
    );
}
