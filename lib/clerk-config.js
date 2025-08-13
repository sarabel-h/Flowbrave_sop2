/**
 * Configuration Clerk pour gérer plusieurs comptes
 */

// Configuration par défaut (production)
const defaultConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}

// Configuration de développement (nouveau compte)
const devConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV,
  secretKey: process.env.CLERK_SECRET_KEY_DEV,
}

// Configuration de test (si nécessaire)
const testConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST,
  secretKey: process.env.CLERK_SECRET_KEY_TEST,
}

/**
 * Obtient la configuration Clerk selon l'environnement
 * @param {string} environment - 'production', 'development', ou 'test'
 * @returns {Object} Configuration avec publishableKey et secretKey
 */
export function getClerkConfig(environment = process.env.NODE_ENV) {
  switch (environment) {
    case 'development':
      return {
        publishableKey: devConfig.publishableKey || defaultConfig.publishableKey,
        secretKey: devConfig.secretKey || defaultConfig.secretKey,
      }
    case 'test':
      return {
        publishableKey: testConfig.publishableKey || defaultConfig.publishableKey,
        secretKey: testConfig.secretKey || defaultConfig.secretKey,
      }
    case 'production':
    default:
      return defaultConfig
  }
}

/**
 * Vérifie si les clés Clerk sont configurées
 * @param {string} environment - Environnement à vérifier
 * @returns {boolean} True si les clés sont configurées
 */
export function isClerkConfigured(environment = process.env.NODE_ENV) {
  const config = getClerkConfig(environment)
  return !!(config.publishableKey && config.secretKey)
}

/**
 * Affiche la configuration actuelle (pour debug)
 */
export function logClerkConfig() {
  const config = getClerkConfig()
  console.log('🔧 Clerk Configuration:')
  console.log('  Environment:', process.env.NODE_ENV)
  console.log('  Publishable Key:', config.publishableKey ? '✅ Configurée' : '❌ Manquante')
  console.log('  Secret Key:', config.secretKey ? '✅ Configurée' : '❌ Manquante')
  
  if (process.env.NODE_ENV === 'development') {
    console.log('  Dev Publishable Key:', devConfig.publishableKey ? '✅ Configurée' : '❌ Manquante')
    console.log('  Dev Secret Key:', devConfig.secretKey ? '✅ Configurée' : '❌ Manquante')
  }
}


