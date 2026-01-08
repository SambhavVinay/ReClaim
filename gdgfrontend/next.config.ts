/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true, // This changes /database to /database/index.html
  images: { unoptimized: true },
};

export default nextConfig;
