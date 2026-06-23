// app/api/admin/pages/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids, action } = await req.json();
    if (!ids?.length) return NextResponse.json({ error: 'No IDs' }, { status: 400 });

    switch (action) {
        case 'publish':
            await prisma.page.updateMany({ where: { id: { in: ids } }, data: { status: 'published' } });
            break;
        case 'draft':
            await prisma.page.updateMany({ where: { id: { in: ids } }, data: { status: 'draft' } });
            break;
        case 'trash':
            await prisma.page.updateMany({ where: { id: { in: ids } }, data: { status: 'trash' } });
            break;
        case 'delete':
            await prisma.page.deleteMany({ where: { id: { in: ids }, status: 'trash' } });
            break;
        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}