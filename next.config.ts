import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Old shared links now lead to the one invitation page.
  async redirects() {
    return [
      ...["index", "landing", "create", "manage", "admin", "date"].flatMap((page) => [
        { source: `/${page}`, destination: "/", permanent: true },
        { source: `/${page}.html`, destination: "/", permanent: true },
      ]),
      { source: "/:slug(d-[a-z0-9]+)", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
