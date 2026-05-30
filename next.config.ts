import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/Hebrew%20Heroes.html",
      },
    ];
  },
};

export default nextConfig;
