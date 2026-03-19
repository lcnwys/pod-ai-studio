/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev && process.platform === 'win32') {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/DumpStack.log.tmp',
          '**/pagefile.sys',
          '**/hiberfil.sys',
          '**/swapfile.sys',
        ],
      };
    }

    return config;
  },
};

export default nextConfig;