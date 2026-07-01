// app/api/admin/posts/lock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

const LOCK_DURATION_MS = 2 * 60 * 1000;

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId, action } = await req.json();
    const userId    = parseInt(session.user.id);
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    if (action === 'release') {
        await prisma.postLock.deleteMany({ where: { postId, userId } });
        return NextResponse.json({ ok: true });
    }

    const existing = await prisma.postLock.findUnique({ where: { postId } });
    if (existing && existing.userId !== userId && new Date(existing.expiresAt) > new Date()) {
        const locker = await prisma.user.findUnique({ where: { id: existing.userId }, select: { name: true } });
        return NextResponse.json({ locked: true, lockedBy: locker?.name });
    }

    await prisma.postLock.upsert({
        where:  { postId },
        create: { postId, userId, expiresAt },
        update: { userId, expiresAt, lockedAt: new Date() },
    });

    return NextResponse.json({ ok: true, locked: false });
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId } = await req.json();
    const userId    = parseInt(session.user.id);
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    await prisma.postLock.upsert({
        where:  { postId },
        create: { postId, userId, expiresAt },
        update: { userId, expiresAt, lockedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
}
