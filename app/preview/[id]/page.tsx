// app/preview/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import crypto from 'crypto';
import ParentTemplate from '@/components/templates/ParentTemplate';
import ChildTemplate from '@/components/templates/ChildTemplate';
import HomeTemplate from '@/components/templates/HomeTemplate';

type Props = {
    params:      Promise<{ id: string }>;
    searchParams:Promise<{ token?: string }>;
};

function generatePreviewToken(pageId: number): string {
    return crypto
        .createHmac('sha256', process.env.NEXTAUTH_SECRET!)
        .update(`preview-${pageId}`)
        .digest('hex')
        .slice(0, 24);
}

export const metadata = {
    robots: { index: false, follow: false },
};

export default async function PreviewPage({ params, searchParams }: Props) {
    const { id }    = await params;
    const { token } = await searchParams;
    const pageId    = parseInt(id);

    // Check auth — must be logged in OR have valid token
    const session      = await getServerSession(authOptions);
    const validToken   = generatePreviewToken(pageId);
    const hasValidToken = token === validToken;

    if (!session && !hasValidToken) {
        redirect('/admin/login');
    }

    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) notFound();

    // Convert to WPPage shape the templates expect
    const wpPage = {
        id:                 page.id,
        title:              page.title,
        slug:               page.slug,
        fullPath:           page.fullPath,
        content:            page.content,
        status:             page.status,
        template:           page.template,
        templateFile:       page.templateFile,
        menuOrder:          page.menuOrder,
        parentId:           page.parentId,
        parentSlug:         page.parentSlug,
        parentFullPath:     page.parentFullPath,
        featuredImage:      page.featuredImage,
        featuredImageLocal: page.featuredImageLocal,
        featuredImageAlt:   page.featuredImageAlt,
        metaTitle:          page.metaTitle,
        metaDescription:    page.metaDescription,
    };

    return (
        <div>
            {/* Preview banner */}
            <div style={{
                background:     '#f59e0b',
                color:          '#1c1917',
                padding:        '10px 20px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                fontSize:       '13px',
                fontWeight:     600,
                position:       'sticky',
                top:            0,
                zIndex:         999,
            }}>
                <span>
                    👁 Preview Mode — This page is <strong>{page.status}</strong> and not publicly visible
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {session && (
                        <a
                            href={`/admin/pages/${page.id}/edit`}
                            style={{
                                background:     '#1B6CA8',
                                color:          '#fff',
                                padding:        '5px 14px',
                                borderRadius:   '5px',
                                textDecoration: 'none',
                                fontSize:       '12px',
                            }}
                        >
                            ← Back to Editor
                        </a>
                    )}
                </div>
            </div>

            {/* Render correct template */}
            {page.template === 'home'   && <HomeTemplate   page={wpPage as any} />}
            {page.template === 'parent' && <ParentTemplate page={wpPage as any} />}
            {page.template === 'child'  && <ChildTemplate  page={wpPage as any} />}
            {(page.template === 'default' || !page.template) && (
                <ChildTemplate page={wpPage as any} />
            )}
        </div>
    );
}