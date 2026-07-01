// app/admin/users/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from '@/components/admin/UsersClient';

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') redirect('/admin/dashboard');

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
            id:        true,
            name:      true,
            email:     true,
            role:      true,
            avatar:    true,
            active:    true,
            createdAt: true,
            _count: { select: { pages: true, posts: true } },
        },
    });

    return (
        <UsersClient
            initialUsers={users as any}
            currentUserId={parseInt(session.user.id)}
        />
    );
}
