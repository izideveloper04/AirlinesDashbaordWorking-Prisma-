// app/admin/posts/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PostsClient from '@/components/admin/PostsClient';

type Props = {
    searchParams: Promise<{ status?: string; search?: string; p?: string }>;
};

export default async function AdminPostsPage({ searchParams }: Props) {
    const session = await getServerSession(authOptions);
    const params  = await searchParams;

    const status  = params.status || 'all';
    const search  = params.search || '';
    const page    = parseInt(params.p || '1');
    const perPage = 20;

    const where: any = {
        ...(status !== 'all' ? { status } : { status: { not: 'trash' } }),
        ...(search ? { title: { contains: search } } : {}),
    };

    const [posts, total, counts] = await Promise.all([
        prisma.post.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip:    (page - 1) * perPage,
            take:    perPage,
            include: {
                createdBy:  { select: { name: true } },
                lock:       { include: { user: { select: { name: true } } } },
                categories: { include: { category: { select: { name: true } } } },
            },
        }),
        prisma.post.count({ where }),
        Promise.all([
            prisma.post.count({ where: { status: { not: 'trash' } } }),
            prisma.post.count({ where: { status: 'published' } }),
            prisma.post.count({ where: { status: 'draft'     } }),
            prisma.post.count({ where: { status: 'trash'     } }),
        ]),
    ]);

    const [allCount, publishedCount, draftCount, trashCount] = counts;
    const totalPages = Math.ceil(total / perPage);

    return (
        <PostsClient
            posts={posts as any}
            total={total}
            totalPages={totalPages}
            currentPage={page}
            currentStatus={status}
            currentSearch={search}
            counts={{ all: allCount, published: publishedCount, draft: draftCount, trash: trashCount }}
            userRole={session?.user.role || 'editor'}
        />
    );
}
