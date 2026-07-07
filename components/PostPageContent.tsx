// components/PostPageContent.tsx
import Link from 'next/link';
import FaqSection from '@/components/FaqSection';

type Post = {
    id:              number;
    title:           string;
    slug:            string;
    content:         string;
    excerpt:         string;
    featuredImage:   string | null;
    featuredImageAlt:string | null;
    faqSchema:       string | null;
    createdAt:       Date;
    updatedAt:       Date;
    categories: { category: { name: string; slug: string } }[];
    tags:       { tag:      { name: string; slug: string } }[];
};

type Props = {
    post:          Post;
    permalinkBase: string;
};

export default function PostPageContent({ post }: Props) {
    const faqs: { question: string; answer: string }[] = post.faqSchema
        ? JSON.parse(post.faqSchema)
        : [];

    return (
        <main className="blog-page">
            <div className="blog-container" style={{ maxWidth: '820px' }}>

                {/* Breadcrumb */}
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link href="/">Home</Link>
                    <span className="sep">›</span>
                    <Link href="/blog">Blog</Link>
                    <span className="sep">›</span>
                    <span className="current">{post.title}</span>
                </nav>

                <article className="post-article">
                    <header className="post-header">
                        {post.categories.length > 0 && (
                            <div className="blog-chip-row" style={{ marginBottom: '12px' }}>
                                {post.categories.map(({ category: cat }) => (
                                    <Link key={cat.slug} href={`/category/${cat.slug}`} className="blog-chip">
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                        <h1 className="post-title">{post.title}</h1>
                        <div className="post-meta">
                            <time>
                                {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                            {post.updatedAt > post.createdAt && (
                                <span>
                                    · Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </header>

                    {post.featuredImage && (
                        <img
                            src={post.featuredImage}
                            alt={post.featuredImageAlt || post.title}
                            className="post-featured-img"
                        />
                    )}

                    <div
                        className="post-content wp-content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {post.tags.length > 0 && (
                        <div className="post-tag-section">
                            <span className="post-tag-label">Tags:</span>
                            <div className="blog-chip-row">
                                {post.tags.map(({ tag }) => (
                                    <Link key={tag.slug} href={`/tag/${tag.slug}`} className="blog-chip tag">
                                        #{tag.name}
                                    </Link>
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

                <Link href="/blog" className="blog-back-link">← Back to Blog</Link>

            </div>
        </main>
    );
}
