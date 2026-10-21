import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        // A new worker must be checked online so its versioned cache can update.
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    }, ...['/reset-offline.html', '/reset-offline.js'].map(source => ({
      source,
      // Recovery must always come from the network, even when the game is old.
      headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
    }))];
  },
};

export default nextConfig;
