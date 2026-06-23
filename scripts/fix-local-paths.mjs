// scripts/fix-local-paths.mjs
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma   = new PrismaClient();
const IMG_DIR  = './public/images/uploads';

async function main() {
    const pages = await prisma.page.findMany({
        where: { featuredImage: { not: '' } },
        select: { id: true, featuredImage: true, featuredImageLocal: true },
    });

    console.log(`\n📄 Found ${pages.length} pages with featured images\n`);

    let fixed   = 0;
    let skipped = 0;
    let missing = 0;

    for (const page of pages) {
        // Already has local path set — skip
        if (page.featuredImageLocal) {
            skipped++;
            continue;
        }

        // If featuredImage is already a local path
        if (page.featuredImage.startsWith('/images/uploads/')) {
            await prisma.page.update({
                where: { id: page.id },
                data:  { featuredImageLocal: page.featuredImage },
            });
            fixed++;
            continue;
        }

        // Find downloaded file by page ID in public/images/uploads/
        const files = fs.readdirSync(IMG_DIR);
        const match = files.find(f => f.startsWith(`${page.id}.`));

        if (match) {
            await prisma.page.update({
                where: { id: page.id },
                data:  { featuredImageLocal: `/images/uploads/${match}` },
            });
            fixed++;
        } else {
            missing++;
        }
    }

    console.log(`✅ Done!`);
    console.log(`   Fixed   : ${fixed}`);
    console.log(`   Skipped : ${skipped}`);
    console.log(`   Missing : ${missing}\n`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });