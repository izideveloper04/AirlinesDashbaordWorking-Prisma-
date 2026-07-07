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
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return {};
    return {
        title:       `${category.name} | Airlines Office Map Blog`,
        description: `All posts in the ${category.name} category.`,
    };
}

export default async function CategoryArchivePage({ params }: Props) {
    const { slug } = await params;

    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) notFound();

    const [posts, permalinkBase] = await Promise.all([
        prisma.post.findMany({
            where:   { status: 'published', categories: { some: { categoryId: category.id } } },
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
                    <span className="current">Category: {category.name}</span>
                </nav>

                {/* Hero */}
                <div className="blog-hero">
                    <span className="blog-hero-badge">Category</span>
                    <h1 className="blog-hero-title">{category.name}</h1>
                    <p className="blog-hero-sub">{posts.length} post{posts.length !== 1 ? 's' : ''} in this category</p>
                </div>

                {/* Posts */}
                {posts.length === 0 ? (
                    <div className="blog-empty">No published posts in this category yet.</div>
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
