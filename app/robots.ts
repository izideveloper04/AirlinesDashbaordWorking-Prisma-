// app/robots.ts — generated dynamically based on the admin setting
import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/pages';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const setting    = await prisma.setting.findUnique({ where: { key: 'discourageSearchEngines' } });
    const discourage = setting?.value === 'true';

    return {
        rules: {
            userAgent: '*',
            disallow:  discourage ? '/' : '',
        },
    };
}
