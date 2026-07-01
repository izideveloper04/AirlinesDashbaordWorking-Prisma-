// app/admin/settings/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/admin/SettingsClient';

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') redirect('/admin/dashboard');

    const setting    = await prisma.setting.findUnique({ where: { key: 'discourageSearchEngines' } });
    const discourage = setting?.value === 'true';

    return <SettingsClient initialDiscourage={discourage} />;
}
