// Fichier temporaire pour déboguer les variables d'environnement
export function debugEnvironmentVariables() {
  console.log('=== VARIABLES D\'ENVIRONNEMENT DISPONIBLES ===');
  console.log('process.env:', process.env);
  
  // Variables spécifiques au projet
  console.log('\n=== VARIABLES SPÉCIFIQUES AU PROJET ===');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Définie' : '❌ Non définie');
  console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Définie' : '❌ Non définie');
  console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? '✅ Définie' : '❌ Non définie');
  console.log('BILLING_RETURN_URL:', process.env.BILLING_RETURN_URL ? '✅ Définie' : '❌ Non définie');
  console.log('NEXT_PUBLIC_POSTHOG_KEY:', process.env.NEXT_PUBLIC_POSTHOG_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('NEXT_PUBLIC_POSTHOG_HOST:', process.env.NEXT_PUBLIC_POSTHOG_HOST ? '✅ Définie' : '❌ Non définie');
  console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '✅ Définie' : '❌ Non définie');
  
  console.log('\n=== AUTRES VARIABLES ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_* variables:');
  Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).forEach(key => {
    console.log(`  ${key}: ${process.env[key] ? '✅ Définie' : '❌ Non définie'}`);
  });
  
  console.log('==========================================');
} 