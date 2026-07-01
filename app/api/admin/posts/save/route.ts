// app/api/admin/posts/save/route.ts
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
        content,
        excerpt,
        status,
        featuredImage,
        featuredImageAlt,
        metaTitle,
        metaDescription,
        faqSchema,
        categoryIds,
        tagNames,
    } = body;

    const userId = parseInt(session.user.id);

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
    }

    // Validate slug uniqueness
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
    }

    const data = {
        title:           title           || 'Untitled',
        slug:            slug            || '',
        content:         content         || '',
        excerpt:         excerpt         || '',
        status:          status          || 'draft',
        featuredImage:   featuredImage   || '',
        featuredImageAlt:featuredImageAlt|| '',
        metaTitle:       metaTitle       || '',
        metaDescription: metaDescription || '',
        faqSchema:       faqSchema       || '[]',
        createdById:     userId,
    };

    let post: { id: number };
    try {
        if (id) {
            post = await prisma.post.update({ where: { id }, data });
        } else {
            post = await prisma.post.create({ data });
        }

        // Sync categories (delete all, re-insert)
        await prisma.postCategory.deleteMany({ where: { postId: post.id } });
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            await prisma.postCategory.createMany({
                data: categoryIds.map((cid: number) => ({ postId: post.id, categoryId: cid })),
            });
        }

        // Sync tags (upsert by name, then link)
        await prisma.postTag.deleteMany({ where: { postId: post.id } });
        if (Array.isArray(tagNames) && tagNames.length > 0) {
            for (const name of tagNames) {
                const tagSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (!tagSlug) continue;
                const tag = await prisma.tag.upsert({
                    where:  { slug: tagSlug },
                    create: { name: name.trim(), slug: tagSlug },
                    update: {},
                });
                await prisma.postTag.upsert({
                    where:  { postId_tagId: { postId: post.id, tagId: tag.id } },
                    create: { postId: post.id, tagId: tag.id },
                    update: {},
                });
            }
        }
    } catch (err: any) {
        console.error('Post save error:', err);
        return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
    }

    // Release lock on save
    try {
        await prisma.postLock.deleteMany({ where: { postId: post.id } });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, id: post.id });
}
