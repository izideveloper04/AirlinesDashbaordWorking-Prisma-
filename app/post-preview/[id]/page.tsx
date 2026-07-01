// app/post-preview/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import Link from 'next/link';
import FaqSection from '@/components/FaqSection';

export const metadata = {
    robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function PostPreviewPage({ params }: Props) {
    const { id } = await params;
    const postId  = parseInt(id);

    const post = await prisma.post.findUnique({
        where:   { id: postId },
        include: {
            categories: { include: { category: { select: { name: true, slug: true } } } },
            tags:       { include: { tag:      { select: { name: true, slug: true } } } },
        },
    });

    if (!post) notFound();

    // If published, redirect to the real URL
    if (post.status === 'published') {
        redirect(`/blog/${post.slug}`);
    }

    // Draft/unpublished → require login
    const session = await getServerSession(authOptions);
    if (!session) redirect('/admin/login');

    const faqs: { question: string; answer: string }[] = post.faqSchema
        ? JSON.parse(post.faqSchema)
        : [];

    return (
        <div>
            {/* Preview banner */}
            <div style={{
                background:     '#f59e0b',
                color:          '#1c1917',
                padding:        '10px 20px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                fontSize:       '13px',
                fontWeight:     600,
                position:       'sticky',
                top:            'var(--header-h, 68px)',
                zIndex:         999,
            }}>
                <span>
                    👁 Preview Mode — This post is <strong>{post.status}</strong> and not publicly visible
                </span>
                <a
                    href={`/admin/posts/${post.id}/edit`}
                    style={{
                        background:     '#1B6CA8',
                        color:          '#fff',
                        padding:        '5px 14px',
                        borderRadius:   '5px',
                        textDecoration: 'none',
                        fontSize:       '12px',
                    }}
                >
                    ← Back to Editor
                </a>
            </div>

            <main style={s.main}>
                <div style={s.container}>
                    <nav style={s.breadcrumb}>
                        <Link href="/" style={s.breadLink}>Home</Link>
                        <span style={s.breadSep}>›</span>
                        <Link href="/blog" style={s.breadLink}>Blog</Link>
                        <span style={s.breadSep}>›</span>
                        <span style={s.breadCurrent}>{post.title}</span>
                    </nav>

                    <article style={s.article}>
                        <header style={s.header}>
                            {post.categories.length > 0 && (
                                <div style={s.catRow}>
                                    {post.categories.map(({ category: cat }) => (
                                        <span key={cat.slug} style={s.catChip}>{cat.name}</span>
                                    ))}
                                </div>
                            )}
                            <h1 style={s.title}>{post.title}</h1>
                            <div style={s.meta}>
                                <time style={s.date}>
                                    {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </time>
                            </div>
                        </header>

                        {post.featuredImage && (
                            <img
                                src={post.featuredImage}
                                alt={post.featuredImageAlt || post.title}
                                style={s.featImg}
                            />
                        )}

                        <div
                            style={s.content}
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {post.tags.length > 0 && (
                            <div style={s.tagSection}>
                                <span style={s.tagLabel}>Tags:</span>
                                <div style={s.tagRow}>
                                    {post.tags.map(({ tag }) => (
                                        <span key={tag.slug} style={s.tagChip}>#{tag.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>

                    {faqs.length > 0 && (
                        <div style={{ marginTop: '40px' }}>
                            <FaqSection faqs={faqs} pageTitle={post.title} />
                        </div>
                    )}
                </div>
            </main>
        </div>
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
    catChip:     { background: '#E8F4FD', color: '#1B6CA8', borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
    title:       { fontSize: '30px', fontWeight: 800, color: '#0A1628', lineHeight: 1.3, margin: '0 0 12px' },
    meta:        { display: 'flex', alignItems: 'center', gap: '6px' },
    date:        { fontSize: '13px', color: '#7A909E' },
    featImg:     { width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' },
    content:     { padding: '32px 36px', fontSize: '16px', lineHeight: 1.75, color: '#1A2B3C', overflowWrap: 'break-word' },
    tagSection:  { display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 36px', borderTop: '1px solid #E2EAF0', flexWrap: 'wrap' },
    tagLabel:    { fontSize: '13px', fontWeight: 700, color: '#4A6070' },
    tagRow:      { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    tagChip:     { color: '#1B6CA8', fontSize: '13px', background: '#F0F7FF', padding: '3px 10px', borderRadius: '99px', fontWeight: 500 },
};
