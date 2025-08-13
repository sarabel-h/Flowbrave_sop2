let userConfig = undefined
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Clés Clerk - peuvent être différentes selon l'environnement
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    
    // Clés Clerk alternatives pour développement/test
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV,
    CLERK_SECRET_KEY_DEV: process.env.CLERK_SECRET_KEY_DEV,
    
    MONGODB_URI: process.env.MONGODB_URI,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
