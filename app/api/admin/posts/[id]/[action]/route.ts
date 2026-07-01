// app/api/admin/posts/[id]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

type Params = { params: Promise<{ id: string; action: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, action } = await params;
    const postId = parseInt(id);

    switch (action) {
        case 'trash':
            await prisma.post.update({ where: { id: postId }, data: { status: 'trash' } });
            return NextResponse.json({ ok: true });

        case 'restore':
            await prisma.post.update({ where: { id: postId }, data: { status: 'draft' } });
            return NextResponse.json({ ok: true });

        case 'delete':
            await prisma.post.delete({ where: { id: postId } });
            return NextResponse.json({ ok: true });

        case 'duplicate': {
            const original = await prisma.post.findUnique({
                where:   { id: postId },
                include: { categories: true, tags: true },
            });
            if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const newSlug = `${original.slug}-copy-${Date.now()}`;
            const userId  = parseInt(session.user.id);

            const duplicate = await prisma.post.create({
                data: {
                    title:           `${original.title} (Copy)`,
                    slug:            newSlug,
                    content:         original.content,
                    excerpt:         original.excerpt,
                    status:          'draft',
                    featuredImage:   original.featuredImage,
                    featuredImageAlt:original.featuredImageAlt,
                    metaTitle:       original.metaTitle,
                    metaDescription: original.metaDescription,
                    faqSchema:       original.faqSchema,
                    createdById:     userId,
                },
            });

            // Copy categories
            if (original.categories.length > 0) {
                await prisma.postCategory.createMany({
                    data: original.categories.map(c => ({ postId: duplicate.id, categoryId: c.categoryId })),
                });
            }
            // Copy tags
            if (original.tags.length > 0) {
                await prisma.postTag.createMany({
                    data: original.tags.map(t => ({ postId: duplicate.id, tagId: t.tagId })),
                });
            }

            return NextResponse.json({ id: duplicate.id });
        }

        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
}
