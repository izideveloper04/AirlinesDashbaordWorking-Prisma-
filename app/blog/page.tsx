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
        <main style={s.main}>
            <div style={s.container}>
                <div style={s.hero}>
                    <h1 style={s.heroTitle}>Blog</h1>
                    <p style={s.heroSub}>Articles, guides, and news about airline offices worldwide.</p>
                </div>

                {posts.length === 0 ? (
                    <div style={s.empty}>No posts published yet.</div>
                ) : (
                    <div style={s.grid}>
                        {posts.map(post => (
                            <article key={post.id} style={s.card}>
                                {post.featuredImage && (
                                    <Link href={buildPostUrl(post.slug, permalinkBase)} style={{ display: 'block' }}>
                                        <img
                                            src={post.featuredImage}
                                            alt={post.featuredImageAlt || post.title}
                                            style={s.cardImg}
                                        />
                                    </Link>
                                )}
                                <div style={s.cardBody}>
                                    {post.categories.length > 0 && (
                                        <div style={s.catRow}>
                                            {post.categories.map(({ category: cat }) => (
                                                <Link key={cat.slug} href={`/category/${cat.slug}`} style={s.catChip}>
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    <h2 style={s.cardTitle}>
                                        <Link href={buildPostUrl(post.slug, permalinkBase)} style={s.cardTitleLink}>
                                            {post.title}
                                        </Link>
                                    </h2>
                                    {(post.excerpt || post.content) && (
                                        <p style={s.cardExcerpt}>
                                            {post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 160) + '…'}
                                        </p>
                                    )}
                                    <div style={s.cardMeta}>
                                        <span style={s.metaDate}>
                                            {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        {post.tags.length > 0 && (
                                            <div style={s.tagRow}>
                                                {post.tags.map(({ tag }) => (
                                                    <Link key={tag.slug} href={`/tag/${tag.slug}`} style={s.tagChip}>
                                                        #{tag.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Link href={buildPostUrl(post.slug, permalinkBase)} style={s.readMore}>Read more →</Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

const s: Record<string, React.CSSProperties> = {
    main:          { background: '#F8FAFC', minHeight: '100vh' },
    container:     { maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' },
    hero:          { marginBottom: '40px' },
    heroTitle:     { fontSize: '36px', fontWeight: 800, color: '#0A1628', margin: '0 0 8px' },
    heroSub:       { fontSize: '16px', color: '#7A909E', margin: 0 },
    empty:         { textAlign: 'center', padding: '80px', color: '#7A909E', fontSize: '16px' },
    grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' },
    card:          { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    cardImg:       { width: '100%', height: '200px', objectFit: 'cover', display: 'block' },
    cardBody:      { padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' },
    catRow:        { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    catChip:       { background: '#E8F4FD', color: '#1B6CA8', borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' },
    cardTitle:     { margin: 0, fontSize: '18px', fontWeight: 700, lineHeight: 1.4 },
    cardTitleLink: { color: '#0A1628', textDecoration: 'none' },
    cardExcerpt:   { color: '#4A6070', fontSize: '14px', lineHeight: 1.6, margin: 0 },
    cardMeta:      { display: 'flex', flexDirection: 'column', gap: '6px' },
    metaDate:      { fontSize: '12px', color: '#7A909E' },
    tagRow:        { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    tagChip:       { color: '#7A909E', fontSize: '12px', textDecoration: 'none' },
    readMore:      { marginTop: 'auto', color: '#1B6CA8', fontWeight: 600, fontSize: '13px', textDecoration: 'none' },
};
