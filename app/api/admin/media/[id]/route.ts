// app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import { unlink } from 'fs/promises';
import path from 'path';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const mediaId = parseInt(id);
    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { alt, title } = body;

    const updated = await prisma.media.update({
        where: { id: mediaId },
        data: {
            ...(alt   !== undefined ? { alt   } : {}),
            ...(title !== undefined ? { title } : {}),
        },
    });

    return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const mediaId = parseInt(id);

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Delete from filesystem
    try {
        const filePath = path.join(process.cwd(), 'public', media.url);
        await unlink(filePath);
    } catch { /* file may already be missing */ }

    await prisma.media.delete({ where: { id: mediaId } });

    return NextResponse.json({ ok: true });
}
