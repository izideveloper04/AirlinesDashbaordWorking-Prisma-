// app/api/admin/media/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '@/lib/uploads';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file     = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WebP, GIF and SVG allowed.' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const bytes    = await file.arrayBuffer();
    const buffer   = Buffer.from(bytes);

    // Generate unique filename
    const ext      = path.extname(file.name).toLowerCase();
    const basename = path.basename(file.name, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
    const filename = `${basename}-${Date.now()}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    const url = `${UPLOAD_URL_PREFIX}${filename}`;

    // Save to media table
    await prisma.media.create({
        data: {
            filename,
            originalName: file.name,
            url,
            size:         file.size,
            mimeType:     file.type,
            uploadedById: parseInt(session.user.id),
        },
    });

    return NextResponse.json({ ok: true, url, filename });
}