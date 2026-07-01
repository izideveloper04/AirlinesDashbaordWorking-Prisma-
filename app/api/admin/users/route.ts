// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import bcrypt from 'bcryptjs';

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    if (session.user.role !== 'admin') return null;
    return session;
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
            id:        true,
            name:      true,
            email:     true,
            role:      true,
            avatar:    true,
            active:    true,
            createdAt: true,
            _count: { select: { pages: true, posts: true } },
        },
    });

    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password, role, active } = body;

    if (!name?.trim())     return NextResponse.json({ error: 'Name is required.'     }, { status: 400 });
    if (!email?.trim())    return NextResponse.json({ error: 'Email is required.'    }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const normalEmail = email.toLowerCase().trim();
    const existing    = await prisma.user.findUnique({ where: { email: normalEmail } });
    if (existing) return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });

    const validRoles = ['admin', 'editor'];
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            name:   name.trim(),
            email:  normalEmail,
            password: hashed,
            role:   validRoles.includes(role) ? role : 'editor',
            active: active !== false,
        },
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user });
}
