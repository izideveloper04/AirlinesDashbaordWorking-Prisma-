// app/admin/posts/[id]/edit/page.tsx
import { prisma } from '@/lib/pages';
import { getPostPermalinkBase } from '@/lib/permalink';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    const { id }  = await params;
    const postId  = parseInt(id);

    const post = await prisma.post.findUnique({
        where:   { id: postId },
        include: {
            lock:       { include: { user: { select: { id: true, name: true } } } },
            categories: { select: { categoryId: true } },
            tags:       { include: { tag: { select: { name: true } } } },
        },
    });

    if (!post) notFound();

    const [allCategories, permalinkBase] = await Promise.all([
        prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } }),
        getPostPermalinkBase(),
    ]);

    const now      = new Date();
    const lock     = post.lock;
    const isLocked = lock && new Date(lock.expiresAt) > now && lock.user.id !== parseInt(session!.user.id);
    const lockedBy = isLocked ? lock!.user.name : null;

    return (
        <PostEditor
            post={{
                id:             post.id,
                title:          post.title,
                slug:           post.slug,
                content:        post.content,
                excerpt:        post.excerpt,
                status:         post.status,
                featuredImage:  post.featuredImage,
                featuredImageAlt:post.featuredImageAlt,
                metaTitle:      post.metaTitle,
                metaDescription:post.metaDescription,
                faqSchema:      post.faqSchema,
                categoryIds:    post.categories.map(c => c.categoryId),
                tagNames:       post.tags.map(t => t.tag.name),
            }}
            allCategories={allCategories}
            currentUserId={parseInt(session!.user.id)}
            currentUserName={session!.user.name!}
            isLocked={!!isLocked}
            lockedBy={lockedBy}
            permalinkBase={permalinkBase}
        />
    );
}
