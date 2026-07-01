// app/blog/[slug]/page.tsx
import { prisma } from '@/lib/pages';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import FaqSection from '@/components/FaqSection';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const posts = await prisma.post.findMany({
        where:  { status: 'published' },
        select: { slug: true },
    });
    return posts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) return {};
    return {
        title:       post.metaTitle       || post.title,
        description: post.metaDescription || post.excerpt || '',
        openGraph: {
            title:       post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt || '',
            images:      post.featuredImage ? [post.featuredImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
        where:   { slug },
        include: {
            categories: { include: { category: { select: { name: true, slug: true } } } },
            tags:       { include: { tag:      { select: { name: true, slug: true } } } },
        },
    });

    if (!post || post.status !== 'published') notFound();

    const faqs: { question: string; answer: string }[] = post.faqSchema
        ? JSON.parse(post.faqSchema)
        : [];

    return (
        <main style={s.main}>
            <div style={s.container}>

                {/* Breadcrumb */}
                <nav style={s.breadcrumb}>
                    <Link href="/" style={s.breadLink}>Home</Link>
                    <span style={s.breadSep}>›</span>
                    <Link href="/blog" style={s.breadLink}>Blog</Link>
                    <span style={s.breadSep}>›</span>
                    <span style={s.breadCurrent}>{post.title}</span>
                </nav>

                <article style={s.article}>
                    {/* Header */}
                    <header style={s.header}>
                        {post.categories.length > 0 && (
                            <div style={s.catRow}>
                                {post.categories.map(({ category: cat }) => (
                                    <Link key={cat.slug} href={`/category/${cat.slug}`} style={s.catChip}>
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                        <h1 style={s.title}>{post.title}</h1>
                        <div style={s.meta}>
                            <time style={s.date}>
                                {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                            {post.updatedAt > post.createdAt && (
                                <span style={s.updated}>
                                    · Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </header>

                    {/* Featured image */}
                    {post.featuredImage && (
                        <img
                            src={post.featuredImage}
                            alt={post.featuredImageAlt || post.title}
                            style={s.featImg}
                        />
                    )}

                    {/* Content */}
                    <div
                        style={s.content}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div style={s.tagSection}>
                            <span style={s.tagLabel}>Tags:</span>
                            <div style={s.tagRow}>
                                {post.tags.map(({ tag }) => (
                                    <Link key={tag.slug} href={`/tag/${tag.slug}`} style={s.tagChip}>
                                        #{tag.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </article>

                {/* FAQ Section */}
                {faqs.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <FaqSection faqs={faqs} pageTitle={post.title} />
                    </div>
                )}

                {/* Back link */}
                <div style={{ marginTop: '40px' }}>
                    <Link href="/blog" style={s.backLink}>← Back to Blog</Link>
                </div>

            </div>
        </main>
    );
}

const s: Record<string, React.CSSProperties> = {
    main:        { background: '#F8FAFC', minHeight: '100vh' },
    container:   { maxWidth: '780px', margin: '0 auto', padding: '40px 24px 64px' },
    breadcrumb:  { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', flexWrap: 'wrap' },
    breadLink:   { color: '#7A909E', fontSize: '13px', textDecoration: 'none' },
    breadSep:    { color: '#C4D0DB', fontSize: '13px' },
    breadCurrent:{ color: '#1A2B3C', fontSize: '13px', fontWeight: 600 },
    article:     { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '14px', overflow: 'hidden' },
    header:      { padding: '32px 36px 24px', borderBottom: '1px solid #E2EAF0' },
    catRow:      { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
    catChip:     { background: '#E8F4FD', color: '#1B6CA8', borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' },
    title:       { fontSize: '30px', fontWeight: 800, color: '#0A1628', lineHeight: 1.3, margin: '0 0 12px' },
    meta:        { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
    date:        { fontSize: '13px', color: '#7A909E' },
    updated:     { fontSize: '13px', color: '#7A909E' },
    featImg:     { width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' },
    content:     { padding: '32px 36px', fontSize: '16px', lineHeight: 1.75, color: '#1A2B3C', overflowWrap: 'break-word' },
    tagSection:  { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 36px', borderTop: '1px solid #E2EAF0', flexWrap: 'wrap' },
    tagLabel:    { fontSize: '13px', fontWeight: 700, color: '#4A6070' },
    tagRow:      { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    tagChip:     { color: '#1B6CA8', fontSize: '13px', textDecoration: 'none', background: '#F0F7FF', padding: '3px 10px', borderRadius: '99px', fontWeight: 500 },
    backLink:    { color: '#1B6CA8', fontWeight: 600, fontSize: '14px', textDecoration: 'none' },
};
