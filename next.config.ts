import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR when opening dev server via LAN IP (e.g. http://10.10.80.64:3456)
  allowedDevOrigins: ["10.10.80.64"],
  serverExternalPackages: ["@prisma/adapter-better-sqlite3", "better-sqlite3"],
};

export default nextConfig;
