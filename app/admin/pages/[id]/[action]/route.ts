// app/api/admin/pages/[id]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

type Params = { params: Promise<{ id: string; action: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, action } = await params;
    const pageId = parseInt(id);

    switch (action) {
        case 'trash':
            await prisma.page.update({ where: { id: pageId }, data: { status: 'trash' } });
            return NextResponse.json({ ok: true });

        case 'restore':
            await prisma.page.update({ where: { id: pageId }, data: { status: 'draft' } });
            return NextResponse.json({ ok: true });

        case 'delete':
            await prisma.page.delete({ where: { id: pageId } });
            return NextResponse.json({ ok: true });

        case 'duplicate': {
            const original = await prisma.page.findUnique({ where: { id: pageId } });
            if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const newSlug    = `${original.slug}-copy-${Date.now()}`;
            const newPath    = `${original.fullPath}-copy-${Date.now()}`;
            const userId     = parseInt(session.user.id);

            const duplicate = await prisma.page.create({
                data: {
                    title:              `${original.title} (Copy)`,
                    slug:               newSlug,
                    fullPath:           newPath,
                    content:            original.content,
                    status:             'draft',
                    template:           original.template,
                    templateFile:       original.templateFile,
                    menuOrder:          original.menuOrder,
                    parentId:           original.parentId,
                    parentSlug:         original.parentSlug,
                    parentFullPath:     original.parentFullPath,
                    featuredImage:      original.featuredImage,
                    featuredImageLocal: original.featuredImageLocal,
                    metaTitle:          original.metaTitle,
                    metaDescription:    original.metaDescription,
                    createdById:        userId,
                },
            });
            return NextResponse.json({ id: duplicate.id });
        }

        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
}