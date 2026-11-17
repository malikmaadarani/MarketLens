import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/inngest': ['./components/logo.png'],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
