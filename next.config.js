/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['googleapis', 'google-auth-library'],
  eslint: {
    // Não bloqueia o build por erros de lint no Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Não bloqueia o build por erros de tipo no Vercel
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
