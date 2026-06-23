import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        // Allow your old WP domain during transition (for any un-downloaded images)
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.airlinesofficelist.com',
            },
        ],
    },
};

export default nextConfig;