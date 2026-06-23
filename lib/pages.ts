// lib/pages.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Prevent multiple Prisma instances in development (hot reload)
export const prisma =
    globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// ─────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────
export type WPPage = {
    id:                 number;
    title:              string;
    slug:               string;
    fullPath:           string;
    content:            string;
    status:             string;
    template:           string;
    templateFile:       string;
    menuOrder:          number;
    parentId:           number | null;
    parentSlug:         string;
    parentFullPath:     string;
    featuredImage:      string;
    featuredImageLocal: string;
    metaTitle:          string; 
    metaDescription:    string;
    featuredImageAlt:   string;
};

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

// Used by [...slug]/page.tsx to find a page from URL
export async function getPageByPath(slugs: string[]): Promise<WPPage | null> {
    const fullPath = slugs.join('/');
    return await prisma.page.findUnique({
        where: { fullPath },
    });
}

// Used by generateStaticParams to pre-render all pages at build time
export async function getAllPagePaths() {
    const pages = await prisma.page.findMany({
        where:  { status: 'published' },
        select: { fullPath: true },
    });

    return pages
        .filter(p => p.fullPath !== '')
        .map(p => ({
            params: { slug: p.fullPath.split('/') }
        }));
}

// Get all pages
export async function getAllPages(): Promise<WPPage[]> {
    return await prisma.page.findMany({
        where:   { status: 'published' },
        orderBy: { menuOrder: 'asc' },
    });
}

// Get direct children of a page sorted A→Z
// Used in ParentTemplate to show child pages grid
export async function getChildPages(parentId: number): Promise<WPPage[]> {
    return await prisma.page.findMany({
        where:   { parentId, status: 'published' },
        orderBy: { title: 'asc' },
    });
}

// Get parent page by ID
// Used in ChildTemplate to show "back to parent" link
export async function getParentPage(parentId: number): Promise<WPPage | null> {
    return await prisma.page.findUnique({
        where: { id: parentId },
    });
}

// Get all sibling pages (same parent), sorted A→Z
// Used in ChildPagesSidebar
export async function getSiblingPages(page: WPPage): Promise<WPPage[]> {
    if (!page.parentId) return [];
    return await prisma.page.findMany({
        where:   { parentId: page.parentId, status: 'published' },
        orderBy: { title: 'asc' },
    });
}

// Get all pages that use parent.php template, sorted A→Z
// Used in AirlinesTemplate
export async function getAllParentPages(): Promise<WPPage[]> {
    const EXCLUDED_TEMPLATE_FILES = [
        'default',
        'page-templates/all.php',
        'page-templates/page_fullwidth.php',
    ];

    return await prisma.page.findMany({
        where: {
            status:      'published',
            template:    'parent',
            templateFile: {
                notIn: EXCLUDED_TEMPLATE_FILES,
            },
        },
        orderBy: { title: 'asc' },
    });
}