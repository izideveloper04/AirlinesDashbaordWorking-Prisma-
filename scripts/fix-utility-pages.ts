import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Fix pages that have template=parent but empty templateFile
    // These are utility pages, not real airline parent pages
    const UTILITY_SLUGS = [
        'blog',
        'about-us',
        'privacy-policy',
        'terms-and-conditions',
        'disclaimer',
    ];

    const result = await prisma.page.updateMany({
        where: {
            slug: { in: UTILITY_SLUGS },
        },
        data: {
            template: 'default',
        },
    });

    console.log(`✅ Fixed ${result.count} utility pages`);
    await prisma.$disconnect();
}

main();