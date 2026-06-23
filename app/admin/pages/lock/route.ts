// app/api/admin/pages/lock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes

// Acquire or refresh lock
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { pageId, action } = await req.json();
    const userId    = parseInt(session.user.id);
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    if (action === 'release') {
        await prisma.pageLock.deleteMany({ where: { pageId, userId } });
        return NextResponse.json({ ok: true });
    }

    // Check if locked by someone else
    const existing = await prisma.pageLock.findUnique({ where: { pageId } });
    if (existing && existing.userId !== userId && new Date(existing.expiresAt) > new Date()) {
        const locker = await prisma.user.findUnique({ where: { id: existing.userId }, select: { name: true } });
        return NextResponse.json({ locked: true, lockedBy: locker?.name });
    }

    // Upsert lock (acquire or heartbeat)
    await prisma.pageLock.upsert({
        where:  { pageId },
        create: { pageId, userId, expiresAt },
        update: { userId, expiresAt, lockedAt: new Date() },
    });

    return NextResponse.json({ ok: true, locked: false });
}

// Takeover lock (force)
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { pageId } = await req.json();
    const userId     = parseInt(session.user.id);
    const expiresAt  = new Date(Date.now() + LOCK_DURATION_MS);

    await prisma.pageLock.upsert({
        where:  { pageId },
        create: { pageId, userId, expiresAt },
        update: { userId, expiresAt, lockedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
}