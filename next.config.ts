import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { ASSET_ORIGIN } from "./lib/assets";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [new URL("/**", ASSET_ORIGIN)],
  },
};

export default withNextIntl(nextConfig);

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
