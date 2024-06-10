// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['clientes.tracom.info', 'gestion.tracom.info'], 
    },
    async rewrites() {
      return [
        {
          source: '/pdf/:path*', 
          destination: 'https://clientes.tracom.info/:path*', 
        },
      ];
    },
  };
  
  export default nextConfig;