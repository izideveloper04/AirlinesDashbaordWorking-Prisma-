// app/admin/tags/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TagsClient from '@/components/admin/TagsClient';

export default async function AdminTagsPage() {
    await getServerSession(authOptions);

    const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
    });

    return <TagsClient tags={tags as any} />;
}
