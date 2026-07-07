// app/admin/categories/page.tsx
import type { Metadata } from 'next';
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CategoriesClient from '@/components/admin/CategoriesClient';

export const metadata: Metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
    await getServerSession(authOptions);

    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
    });

    return <CategoriesClient categories={categories as any} />;
}
