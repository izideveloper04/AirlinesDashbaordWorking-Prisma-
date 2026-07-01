// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import bcrypt from 'bcryptjs';

type Ctx = { params: Promise<{ id: string }> };

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return null;
    return session;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const userId  = parseInt(id);

    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, role, active, password } = body;

    // Validate email uniqueness if being changed
    if (email) {
        const normalEmail = email.toLowerCase().trim();
        const conflict    = await prisma.user.findUnique({ where: { email: normalEmail } });
        if (conflict && conflict.id !== userId) {
            return NextResponse.json({ error: 'Email is already in use by another user.' }, { status: 409 });
        }
    }

    // Validate password if being changed
    if (password !== undefined && password !== '') {
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }
    }

    const validRoles = ['admin', 'editor'];
    const data: any  = {};
    if (name  !== undefined) data.name   = name.trim();
    if (email !== undefined) data.email  = email.toLowerCase().trim();
    if (role  !== undefined && validRoles.includes(role)) data.role = role;
    if (active !== undefined) data.active = active;
    if (password) data.password = await bcrypt.hash(password, 12);

    const updated = await prisma.user.update({
        where:  { id: userId },
        data,
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, avatar: true },
    });

    return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const userId  = parseInt(id);

    // Cannot delete yourself
    if (userId === parseInt(session.user.id)) {
        return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    // Cannot delete the last admin
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin', active: true } });
        if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot delete the last admin account.' }, { status: 400 });
        }
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ ok: true });
}
