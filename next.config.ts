import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Stockfish WASM to be served with correct headers
  async headers() {
    return [
      {
        source: "/stockfish(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },

  // Next.js 16+ uses Turbopack by default
  turbopack: {},
};

export default nextConfig;
