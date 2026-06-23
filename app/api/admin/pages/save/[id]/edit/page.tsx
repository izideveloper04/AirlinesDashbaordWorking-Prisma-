// app/admin/pages/[id]/edit/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import PageEditor from '@/components/admin/PageEditor';

type Props = { params: Promise<{ id: string }> };

export default async function EditPagePage({ params }: Props) {
    const session = await getServerSession(authOptions);
    const { id }  = await params;
    const pageId  = parseInt(id);

    const page = await prisma.page.findUnique({
        where:   { id: pageId },
        include: { lock: { include: { user: { select: { id: true, name: true } } } } },
    });

    if (!page) notFound();

    // Get all pages for parent selector (exclude current page)
    const allPages = await prisma.page.findMany({
        where:   { status: { not: 'trash' }, id: { not: pageId } },
        select:  { id: true, title: true, fullPath: true },
        orderBy: { title: 'asc' },
    });

    // Check lock status
    const now      = new Date();
    const lock     = page.lock;
    const isLocked = lock && new Date(lock.expiresAt) > now && lock.user.id !== parseInt(session!.user.id);
    const lockedBy = isLocked ? lock!.user.name : null;

    return (
        <PageEditor
            page={{
                id:                 page.id,
                title:              page.title,
                slug:               page.slug,
                fullPath:           page.fullPath,
                content:            page.content,
                status:             page.status,
                template:           page.template,
                templateFile:       page.templateFile,
                parentId:           page.parentId,
                featuredImage:      page.featuredImage,
                featuredImageLocal: page.featuredImageLocal,
                featuredImageAlt:   page.featuredImageAlt,
                metaTitle:          page.metaTitle,
                metaDescription:    page.metaDescription,
                menuOrder:          page.menuOrder,
            }}
            allPages={allPages}
            currentUserId={parseInt(session!.user.id)}
            currentUserName={session!.user.name!}
            isLocked={!!isLocked}
            lockedBy={lockedBy}
        />
    );
}