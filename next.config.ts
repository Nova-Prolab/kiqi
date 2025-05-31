
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // Added Imgur hostname
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ["https://6000-firebase-studio-1748619171499.cluster-pgviq6mvsncnqxx6kr7pbz65v6.cloudworkstations.dev"],
};

export default nextConfig;
