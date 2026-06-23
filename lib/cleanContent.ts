// lib/cleanContent.ts
export function cleanWordPressContent(html: string): string {
    if (!html) return '';

    let clean = html;

    // Remove your old WP domain from all internal links
    clean = clean.replaceAll('https://www.airlinesofficelist.com', '');
    clean = clean.replaceAll('http://www.airlinesofficelist.com', '');
    clean = clean.replaceAll('https://airlinesofficelist.com', '');

    // Fix wp-content image paths to point to your local /images/uploads/
    clean = clean.replaceAll('/wp-content/uploads/', '/images/uploads/');

    return clean;
}