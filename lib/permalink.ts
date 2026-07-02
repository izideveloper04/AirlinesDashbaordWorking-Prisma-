// Server-only: reads permalink base from DB
import { prisma } from './pages';

export async function getPostPermalinkBase(): Promise<string> {
    try {
        const s = await prisma.setting.findUnique({ where: { key: 'postPermalinkBase' } });
        return s?.value ?? 'blog';
    } catch {
        return 'blog';
    }
}

export { buildPostUrl, parsePermalinkPattern, buildPermalinkPattern } from './permalink-utils';
