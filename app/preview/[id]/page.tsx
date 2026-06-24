// app/preview/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/pages';
import ChildTemplate from '@/components/templates/ChildTemplate';
import ParentTemplate from '@/components/templates/ParentTemplate';
import HomeTemplate from '@/components/templates/HomeTemplate';

type Props = {
    params:       Promise<{ id: string }>;
    searchParams: Promise<{ token?: string }>;
};

export const metadata = {
    robots: { index: false, follow: false },
};

export default async function PreviewPage({ params }: Props) {
    const { id } = await params;
    const pageId = parseInt(id);

    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) notFound();

    // ── If published → redirect to real URL, no login needed ──
    if (page.status === 'published' && page.fullPath) {
        redirect(`/${page.fullPath}`);
    }

    // ── Draft/unpublished → require login ──
    const session = await getServerSession(authOptions);
    if (!session) redirect('/admin/login');

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
        faqSchema:          page.faqSchema,
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
                top:            'var(--header-h, 68px)',
                zIndex:         999,
            }}>
                <span>
                    👁 Preview Mode — This page is <strong>{page.status}</strong> and not publicly visible
                </span>
                
                    <a href={`/admin/pages/${page.id}/edit`}
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
            </div>

            {page.template === 'home'   && <HomeTemplate   page={wpPage as any} />}
            {page.template === 'parent' && <ParentTemplate page={wpPage as any} />}
            {(page.template === 'child' || page.template === 'default' || !page.template) && (
                <ChildTemplate page={wpPage as any} />
            )}
        </div>
    );
}