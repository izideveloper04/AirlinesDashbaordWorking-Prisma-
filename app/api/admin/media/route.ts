// app/api/admin/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page    = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const perPage = 24;
    const search  = searchParams.get('search') || '';

    const where = search
        ? { OR: [
            { originalName: { contains: search } },
            { title:        { contains: search } },
            { alt:          { contains: search } },
          ] }
        : {};

    const [items, total] = await Promise.all([
        prisma.media.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip:    (page - 1) * perPage,
            take:    perPage,
            include: { uploadedBy: { select: { name: true } } },
        }),
        prisma.media.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, perPage });
}
