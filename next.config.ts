import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Add image optimization options
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Experimental features to help with hydration
  experimental: {
    // React 19 compatibility settings  
    optimizeServerReact: false,
  },
  
  // Turbopack specific config (even though disabled)
  turbopack: {
    root: "/Users/waseemghaly/Documents/PRG/Emad/VS Projects/Dorety Bakery Project/Fadi's Bakery App",
  },
  
  // Webpack configuration to improve hydration stability
  webpack: (config, { dev, isServer }) => {
    // Development-specific webpack optimizations
    if (dev && !isServer) {
      // Improve hydration consistency
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Better chunk splitting for hydration stability
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // React strict mode for better hydration error detection
  reactStrictMode: true,
};

export default nextConfig;
