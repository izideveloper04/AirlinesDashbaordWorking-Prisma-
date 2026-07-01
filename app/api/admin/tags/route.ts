// app/api/admin/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
    });

    return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const tag = await prisma.tag.upsert({
        where:  { slug },
        create: { name: name.trim(), slug },
        update: {},
    });
    return NextResponse.json(tag);
}
