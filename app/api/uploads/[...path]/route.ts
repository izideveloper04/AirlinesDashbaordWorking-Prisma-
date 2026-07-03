// app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from '@/lib/uploads';

const MIME_TYPES: Record<string, string> = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.webp': 'image/webp',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
};

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
    const { path: segments } = await params;
    const filename = segments.join('/');

    // Prevent path traversal outside UPLOAD_DIR
    if (filename.includes('..')) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    try {
        const data = await readFile(path.join(UPLOAD_DIR, filename));
        const ext  = path.extname(filename).toLowerCase();

        return new NextResponse(data, {
            headers: {
                'Content-Type':  MIME_TYPES[ext] || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}
