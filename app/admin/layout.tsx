// app/admin/layout.tsx
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
    robots: {
        index:  false,
        follow: false,
    },
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    // Login page — no shell, just render children directly
    if (!session) {
        return <>{children}</>;
    }

    // Authenticated — wrap in admin shell (no html/body here, root layout handles that)
    return (
        <AdminShell session={session}>
            {children}
        </AdminShell>
    );
}