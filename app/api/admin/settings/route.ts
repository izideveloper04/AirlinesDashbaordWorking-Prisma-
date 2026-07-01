// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return null;
    return session;
}

export async function GET() {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rows = await prisma.setting.findMany();
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    // Upsert each key-value pair sent
    const entries = Object.entries(body) as [string, string][];
    await Promise.all(
        entries.map(([key, value]) =>
            prisma.setting.upsert({
                where:  { key },
                create: { key, value: String(value) },
                update: { value: String(value) },
            })
        )
    );

    return NextResponse.json({ ok: true });
}
