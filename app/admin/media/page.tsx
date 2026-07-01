// app/admin/media/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MediaClient from '@/components/admin/MediaClient';

const PER_PAGE = 24;

type Props = {
    searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function AdminMediaPage({ searchParams }: Props) {
    await getServerSession(authOptions); // auth check (middleware handles redirect)

    const params  = await searchParams;
    const page    = Math.max(1, parseInt(params.page || '1'));
    const search  = params.search || '';

    const where = search
        ? { OR: [
            { originalName: { contains: search } },
            { title:        { contains: search } },
            { alt:          { contains: search } },
          ] }
        : {};

    const [items, total] = await Promise.all([
        prisma.media.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip:    (page - 1) * PER_PAGE,
            take:    PER_PAGE,
            include: { uploadedBy: { select: { name: true } } },
        }),
        prisma.media.count({ where }),
    ]);

    return (
        <MediaClient
            initialItems={items as any}
            initialTotal={total}
            perPage={PER_PAGE}
        />
    );
}
