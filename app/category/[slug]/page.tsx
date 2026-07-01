// app/category/[slug]/page.tsx
import { prisma } from '@/lib/pages';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const categories = await prisma.category.findMany({ select: { slug: true } });
    return categories.map(c => ({ slug: c.slug }));
}

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

    const posts = await prisma.post.findMany({
        where:   { status: 'published', categories: { some: { categoryId: category.id } } },
        orderBy: { createdAt: 'desc' },
        include: {
            categories: { include: { category: { select: { name: true, slug: true } } } },
            tags:       { include: { tag:      { select: { name: true, slug: true } } } },
        },
    });

    return (
        <main style={s.main}>
            <div style={s.container}>

                {/* Breadcrumb */}
                <nav style={s.breadcrumb}>
                    <Link href="/" style={s.breadLink}>Home</Link>
                    <span style={s.breadSep}>›</span>
                    <Link href="/blog" style={s.breadLink}>Blog</Link>
                    <span style={s.breadSep}>›</span>
                    <span style={s.breadCurrent}>Category: {category.name}</span>
                </nav>

                {/* Hero */}
                <div style={s.hero}>
                    <div style={s.heroBadge}>Category</div>
                    <h1 style={s.heroTitle}>{category.name}</h1>
                    <p style={s.heroSub}>{posts.length} post{posts.length !== 1 ? 's' : ''} in this category</p>
                </div>

                {/* Posts */}
                {posts.length === 0 ? (
                    <div style={s.empty}>No published posts in this category yet.</div>
                ) : (
                    <div style={s.grid}>
                        {posts.map(post => (
                            <article key={post.id} style={s.card}>
                                {post.featuredImage && (
                                    <Link href={`/blog/${post.slug}`}>
                                        <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} style={s.cardImg} />
                                    </Link>
                                )}
                                <div style={s.cardBody}>
                                    <h2 style={s.cardTitle}>
                                        <Link href={`/blog/${post.slug}`} style={s.cardTitleLink}>{post.title}</Link>
                                    </h2>
                                    {(post.excerpt || post.content) && (
                                        <p style={s.cardExcerpt}>
                                            {post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 140) + '…'}
                                        </p>
                                    )}
                                    <div style={s.cardFoot}>
                                        <span style={s.cardDate}>
                                            {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        <Link href={`/blog/${post.slug}`} style={s.readMore}>Read →</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '40px' }}>
                    <Link href="/blog" style={s.backLink}>← All Posts</Link>
                </div>
            </div>
        </main>
    );
}

const s: Record<string, React.CSSProperties> = {
    main:          { background: '#F8FAFC', minHeight: '100vh' },
    container:     { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 64px' },
    breadcrumb:    { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', flexWrap: 'wrap' },
    breadLink:     { color: '#7A909E', fontSize: '13px', textDecoration: 'none' },
    breadSep:      { color: '#C4D0DB', fontSize: '13px' },
    breadCurrent:  { color: '#1A2B3C', fontSize: '13px', fontWeight: 600 },
    hero:          { marginBottom: '36px' },
    heroBadge:     { display: 'inline-block', background: '#E8F4FD', color: '#1B6CA8', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
    heroTitle:     { fontSize: '32px', fontWeight: 800, color: '#0A1628', margin: '0 0 8px' },
    heroSub:       { fontSize: '15px', color: '#7A909E', margin: 0 },
    empty:         { textAlign: 'center', padding: '80px', color: '#7A909E', fontSize: '16px' },
    grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    card:          { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    cardImg:       { width: '100%', height: '180px', objectFit: 'cover', display: 'block' },
    cardBody:      { padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' },
    cardTitle:     { margin: 0, fontSize: '17px', fontWeight: 700, lineHeight: 1.4 },
    cardTitleLink: { color: '#0A1628', textDecoration: 'none' },
    cardExcerpt:   { color: '#4A6070', fontSize: '13px', lineHeight: 1.6, margin: 0 },
    cardFoot:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
    cardDate:      { fontSize: '12px', color: '#7A909E' },
    readMore:      { color: '#1B6CA8', fontWeight: 600, fontSize: '13px', textDecoration: 'none' },
    backLink:      { color: '#1B6CA8', fontWeight: 600, fontSize: '14px', textDecoration: 'none' },
};
