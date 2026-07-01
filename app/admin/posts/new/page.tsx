// app/admin/posts/new/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PostEditor from '@/components/admin/PostEditor';

export default async function NewPostPage() {
    const session = await getServerSession(authOptions);

    const allCategories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        select:  { id: true, name: true, slug: true },
    });

    return (
        <PostEditor
            post={null}
            allCategories={allCategories}
            currentUserId={parseInt(session!.user.id)}
            currentUserName={session!.user.name!}
            isLocked={false}
            lockedBy={null}
        />
    );
}
