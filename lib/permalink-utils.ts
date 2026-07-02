// Pure, client-safe permalink helpers — no Prisma import

export function buildPostUrl(slug: string, base: string): string {
    return base ? `/${base}/${slug}` : `/${slug}`;
}

// '/blog/%post-slug%' → 'blog'  |  '/%post-slug%' → ''
export function parsePermalinkPattern(pattern: string): string {
    return pattern.trim()
        .replace(/%post-slug%$/, '')
        .replace(/\/+$/, '')
        .replace(/^\//, '');
}

// 'blog' → '/blog/%post-slug%'  |  '' → '/%post-slug%'
export function buildPermalinkPattern(base: string): string {
    return base ? `/${base}/%post-slug%` : `/%post-slug%`;
}
