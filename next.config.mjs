/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add image domains if needed later (e.g. for user avatars)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
