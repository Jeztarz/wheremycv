import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;

// ให้ `next dev` เข้าถึง binding ของ Cloudflare (D1, env จาก .dev.vars) ได้
initOpenNextCloudflareForDev();
