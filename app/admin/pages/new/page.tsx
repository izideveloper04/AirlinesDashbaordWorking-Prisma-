// app/admin/pages/new/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PageEditor from '@/components/admin/PageEditor';

export default async function NewPagePage() {
    const session  = await getServerSession(authOptions);

    const allPages = await prisma.page.findMany({
        where:   { status: { not: 'trash' } },
        select:  { id: true, title: true, fullPath: true },
        orderBy: { title: 'asc' },
    });

    return (
        <PageEditor
            page={null}
            allPages={allPages}
            currentUserId={parseInt(session!.user.id)}
            currentUserName={session!.user.name!}
            isLocked={false}
            lockedBy={null}
        />
    );
}