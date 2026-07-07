// app/blog/page.tsx
import { prisma } from '@/lib/pages';
import { getPostPermalinkBase, buildPostUrl } from '@/lib/permalink';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog | Airlines Office Map',
    description: 'Latest articles, guides, and news about airline offices worldwide.',
};

export default async function BlogPage() {
    const [posts, permalinkBase] = await Promise.all([
        prisma.post.findMany({
            where:   { status: 'published' },
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
                <div className="blog-hero">
                    <span className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '10px' }}>Airlines Office Map</span>
                    <h1 className="blog-hero-title">Blog</h1>
                    <p className="blog-hero-sub">Articles, guides, and news about airline offices worldwide.</p>
                </div>

                {posts.length === 0 ? (
                    <div className="blog-empty">No posts published yet.</div>
                ) : (
                    <div className="blog-grid">
                        {posts.map(post => (
                            <article key={post.id} className="blog-card">
                                {post.featuredImage && (
                                    <Link href={buildPostUrl(post.slug, permalinkBase)}>
                                        <img
                                            src={post.featuredImage}
                                            alt={post.featuredImageAlt || post.title}
                                            className="blog-card-img"
                                        />
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
                                        <Link href={buildPostUrl(post.slug, permalinkBase)}>
                                            {post.title}
                                        </Link>
                                    </h2>
                                    {(post.excerpt || post.content) && (
                                        <p className="blog-card-excerpt">
                                            {post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 160) + '…'}
                                        </p>
                                    )}
                                    <div className="blog-card-foot">
                                        <span className="blog-card-date">
                                            {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        {post.tags.length > 0 && (
                                            <div className="blog-chip-row">
                                                {post.tags.map(({ tag }) => (
                                                    <Link key={tag.slug} href={`/tag/${tag.slug}`} className="blog-chip tag">
                                                        #{tag.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Link href={buildPostUrl(post.slug, permalinkBase)} className="blog-read-more">Read more →</Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
