
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Allow any HTTPS source - REMOVE or REFINE for production
      {
         protocol: 'https',
         hostname: '**',
      }
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin', 'google-auth-library', '@genkit-ai/googleai'],
  },
};

export default nextConfig;
