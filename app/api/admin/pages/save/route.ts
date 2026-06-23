// app/api/admin/pages/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
        id,
        title,
        slug,
        fullPath,
        content,
        status,
        template,
        templateFile,
        parentId,
        parentSlug,
        parentFullPath,
        featuredImage,
        featuredImageLocal,
        featuredImageAlt,
        metaTitle,
        metaDescription,
        menuOrder,
    } = body;

    const userId = parseInt(session.user.id);

    // Validate required fields
    if (!fullPath && fullPath !== '') {
        return NextResponse.json({ error: 'URL path is required.' }, { status: 400 });
    }

    // Validate slug uniqueness
    if (fullPath !== undefined) {
        const existing = await prisma.page.findUnique({ where: { fullPath } });
        if (existing && existing.id !== id) {
            return NextResponse.json({ error: 'A page with this URL path already exists.' }, { status: 409 });
        }
    }

    const data = {
        title:              title              || 'Untitled',
        slug:               slug               || '',
        fullPath:           fullPath           ?? '',
        content:            content            || '',
        status:             status             || 'draft',
        template:           template           || 'default',
        templateFile:       templateFile       || '',
        parentId:           parentId           || null,
        parentSlug:         parentSlug         || '',
        parentFullPath:     parentFullPath     || '',
        featuredImage:      featuredImage      || '',
        featuredImageLocal: featuredImageLocal || (featuredImage?.startsWith('/images/uploads/') ? featuredImage : ''),
        featuredImageAlt:   featuredImageAlt   || '',
        metaTitle:          metaTitle          || '',
        metaDescription:    metaDescription    || '',
        menuOrder:          menuOrder          || 0,
        createdById:        userId,
    };

    let page;

    try {
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
    } catch (err: any) {
        console.error('Save error:', err);
        return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
    }

    // Release lock on save
    try {
        await prisma.pageLock.deleteMany({ where: { pageId: page.id } });
    } catch { /* lock may not exist, ignore */ }

    return NextResponse.json({ ok: true, id: page.id });
}