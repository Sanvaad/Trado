/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for full Next.js functionality
  async redirects() {
    return [
      {
        source: "/",
        destination: "/screener",
        permanent: false, // set to true if you want it permanent (SEO)
      },
    ];
  },
  images: {
    domains: [
      "assets.coingecko.com",
      "coin-images.coingecko.com",
      "dd.dexscreener.com",
      "via.placeholder.com",
      "avatars.githubusercontent.com",
      "hyperliquid.xyz",
      "pbs.twimg.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/images/**",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        pathname: "/coins/images/**",
      },
      {
        protocol: "https",
        hostname: "dd.dexscreener.com",
        pathname: "/ds-data/tokens/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "hyperliquid.xyz",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
