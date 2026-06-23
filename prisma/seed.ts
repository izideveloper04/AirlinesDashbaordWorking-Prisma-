// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';

const require  = createRequire(import.meta.url);
const prisma   = new PrismaClient();
const pagesData = require('../data/pages-export.json');

async function main() {
    console.log('\n🌱 Starting seed...\n');

    // ─────────────────────────────────────────────
    // 1. Create default admin user
    // ─────────────────────────────────────────────
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@airlinesofficemap.com' },
    });

    if (!existingAdmin) {
        const hashed = await bcrypt.hash('admin123', 12);
        await prisma.user.create({
            data: {
                name:     'Admin',
                email:    'admin@airlinesofficemap.com',
                password: hashed,
                role:     'admin',
            },
        });
        console.log('✅ Admin user created');
        console.log('   Email    : admin@airlinesofficemap.com');
        console.log('   Password : admin123');
        console.log('   ⚠️  Change this password after first login!\n');
    } else {
        console.log('⏭  Admin user already exists, skipping\n');
    }

    // ─────────────────────────────────────────────
    // 2. Import pages
    // ─────────────────────────────────────────────
    console.log(`📄 Importing ${pagesData.length} pages...\n`);

    let created  = 0;
    let skipped  = 0;
    let failed   = 0;
    const errors: string[] = [];

    for (const page of pagesData) {
        try {
            // Skip if fullPath is empty (edge case)
            if (!page.fullPath) {
                skipped++;
                continue;
            }

            // Upsert — safe to run seed multiple times without duplicates
            await prisma.page.upsert({
                where: { fullPath: page.fullPath },
                update: {
                    title:              page.title              ?? '',
                    slug:               page.slug               ?? '',
                    content:            page.content            ?? '',
                    status:             'published',
                    template:           page.template           ?? 'default',
                    templateFile:       page.templateFile      ?? '',
                    menuOrder:          page.menu_order         ?? 0,
                    parentId:           page.parentId          ?? null,
                    parentSlug:         page.parent_slug        ?? '',
                    parentFullPath:     page.parent_fullPath   ?? '',
                    featuredImage:      page.featured_image     ?? '',
                    featuredImageLocal: page.featuredImageLocal ?? '',
                    metaTitle:          page.metaTitle         ?? '',
                    metaDescription:    page.metaDescription  ?? '',
                },
                create: {
                    id:                 page.id,
                    title:              page.title              ?? '',
                    slug:               page.slug               ?? '',
                    fullPath:           page.fullPath,
                    content:            page.content            ?? '',
                    status:             'published',
                    template:           page.template           ?? 'default',
                    templateFile:       page.templateFile      ?? '',
                    menuOrder:          page.menu_order         ?? 0,
                    parentId:           page.parentId          ?? null,
                    parentSlug:         page.parent_slug        ?? '',
                    parentFullPath:     page.parent_fullPath   ?? '',
                    featuredImage:      page.featured_image     ?? '',
                    featuredImageLocal: page.featuredImageLocal ?? '',
                    metaTitle:          page.metaTitle         ?? '',
                    metaDescription:    page.metaDescription  ?? '',
                },
            });

            created++;

            // Log progress every 100 pages
            if (created % 100 === 0) {
                console.log(`   ... ${created}/${pagesData.length} pages imported`);
            }

        } catch (err: any) {
            failed++;
            errors.push(`[${page.id}] ${page.title}: ${err.message}`);
        }
    }

    // ─────────────────────────────────────────────
    // 3. Summary
    // ─────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────');
    console.log('✅ Seed complete!');
    console.log(`   Imported : ${created}`);
    console.log(`   Skipped  : ${skipped}`);
    console.log(`   Failed   : ${failed}`);
    console.log('─────────────────────────────────────────\n');

    if (errors.length > 0) {
        console.log('⚠️  Errors:');
        errors.forEach(e => console.log('  ', e));
    }
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });