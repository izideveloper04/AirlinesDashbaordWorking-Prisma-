// app/api/preview/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import crypto from 'crypto';

export function generatePreviewToken(pageId: number): string {
    return crypto
        .createHmac('sha256', process.env.NEXTAUTH_SECRET!)
        .update(`preview-${pageId}`)
        .digest('hex')
        .slice(0, 24);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id }  = await params;
    const pageId  = parseInt(id);
    const token   = req.nextUrl.searchParams.get('token');

    // Must be logged in OR have valid token
    const session      = await getServerSession(authOptions);
    const validToken   = generatePreviewToken(pageId);
    const hasValidToken = token === validToken;

    if (!session && !hasValidToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true, page });
}