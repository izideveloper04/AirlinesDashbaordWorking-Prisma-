// app/api/admin/pages/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
        id, title, slug, fullPath, content, status,
        template, templateFile, parentId, parentSlug,
        parentFullPath, featuredImage, featuredImageLocal,
        metaTitle, metaDescription, menuOrder,
    } = body;

    const userId = parseInt(session.user.id);

    // Validate slug uniqueness
    const existing = await prisma.page.findUnique({ where: { fullPath } });
    if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'A page with this URL path already exists.' }, { status: 409 });
    }

    const data = {
        title:              title       || 'Untitled',
        slug:               slug        || '',
        fullPath:           fullPath    || '',
        content:            content     || '',
        status:             status      || 'draft',
        template:           template    || 'default',
        templateFile:       templateFile|| '',
        parentId:           parentId    || null,
        parentSlug:         parentSlug  || '',
        parentFullPath:     parentFullPath || '',
        featuredImage:      featuredImage  || '',
        featuredImageLocal: featuredImageLocal || '',
        metaTitle:          metaTitle   || '',
        metaDescription:    metaDescription || '',
        menuOrder:          menuOrder   || 0,
        createdById:        userId,
    };

    let page;

    if (id) {
        // Save revision before updating
        const current = await prisma.page.findUnique({ where: { id } });
        if (current) {
            await prisma.revision.create({
                data: {
                    pageId:      id,
                    title:       current.title,
                    content:     current.content,
                    changedById: userId,
                },
            });
        }

        page = await prisma.page.update({ where: { id }, data });
    } else {
        page = await prisma.page.create({ data });
    }

    // Release lock on save
    await prisma.pageLock.deleteMany({ where: { pageId: page.id } });

    return NextResponse.json({ ok: true, id: page.id });
}