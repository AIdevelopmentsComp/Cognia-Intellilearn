/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    // !! WARN !!
    // Ignorar errores de TypeScript durante el build
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  env: {
    NEXTAUTH_URL: 'https://cogniaintellilearn.web.app',
    NEXTAUTH_SECRET: 'UnValorSecretoAleatorioParaEncriptarTokens',
    GOOGLE_CLIENT_ID: '271373685316-mcrruvatd9fis4ghspqe2d7ls4cqtmnif.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: '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',
  }
};

module.exports = nextConfig; 