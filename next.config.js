/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/client/:projectNumber/:version',
        destination: '/',
      },
      {
        source: '/client/:projectNumber',
        destination: '/',
      },
    ];
  },
};

module.exports = nextConfig;

