import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Allow the LAN IP to access Next.js dev resources (HMR, webpack-hmr)
    // so the site works properly when opened from other devices on the network.
    allowedDevOrigins: ['192.168.1.60'],

    // Serve uploaded media through the API route (which reads from UPLOAD_DIR)
    // instead of Next's built-in public/ static file server, since UPLOAD_DIR
    // may point at a mounted volume outside the public/ directory.
    async rewrites() {
        return [
            { source: '/images/uploads/:path*', destination: '/api/uploads/:path*' },
        ];
    },

    images: {
        // Allow your old WP domain during transition (for any un-downloaded images)
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.airlinesofficelist.com',
            },
        ],
        // Allow local /images/uploads/ paths
        localPatterns: [
            {
                pathname: '/images/uploads/**',
            },
        ],
    },
};

export default nextConfig;