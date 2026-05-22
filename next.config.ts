import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR when opening dev server via LAN IP (e.g. http://10.10.80.64:3456)
  allowedDevOrigins: ["10.10.80.64"],
};

export default nextConfig;
