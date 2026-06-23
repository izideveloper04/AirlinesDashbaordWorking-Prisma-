// app/admin/pages/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import PagesClient from '@/components/admin/PagesClient';

type Props = {
    searchParams: Promise<{ status?: string; search?: string; p?: string }>;
};

export default async function AdminPagesPage({ searchParams }: Props) {
    const session = await getServerSession(authOptions);
    const params  = await searchParams;

    const status = params.status || 'all';
    const search = params.search || '';
    const page   = parseInt(params.p || '1');
    const perPage = 20;

    const where: any = {
        ...(status !== 'all' ? { status } : { status: { not: 'trash' } }),
        ...(search ? { title: { contains: search } } : {}),
    };

    const [pages, total, counts] = await Promise.all([
        prisma.page.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip:    (page - 1) * perPage,
            take:    perPage,
            include: {
                createdBy: { select: { name: true } },
                lock:      { include: { user: { select: { name: true } } } },
            },
        }),
        prisma.page.count({ where }),
        Promise.all([
            prisma.page.count({ where: { status: { not: 'trash' } } }),
            prisma.page.count({ where: { status: 'published' } }),
            prisma.page.count({ where: { status: 'draft'     } }),
            prisma.page.count({ where: { status: 'trash'     } }),
        ]),
    ]);

    const [allCount, publishedCount, draftCount, trashCount] = counts;
    const totalPages = Math.ceil(total / perPage);

    return (
        <PagesClient
            pages={pages as any}
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