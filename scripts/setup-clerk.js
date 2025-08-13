#!/usr/bin/env node

/**
 * Script pour configurer les clés Clerk
 * Usage: node scripts/setup-clerk.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration des clés Clerk\n');

// Vérifier si .env.local existe
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📁 Fichier .env.local trouvé');
  
  // Lire le contenu actuel
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  
  // Vérifier les clés existantes
  const hasProductionKeys = currentEnv.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=') && 
                           currentEnv.includes('CLERK_SECRET_KEY=');
  
  const hasDevKeys = currentEnv.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV=') && 
                    currentEnv.includes('CLERK_SECRET_KEY_DEV=');
  
  console.log('✅ Clés de production:', hasProductionKeys ? 'Configurées' : 'Manquantes');
  console.log('✅ Clés de développement:', hasDevKeys ? 'Configurées' : 'Manquantes');
  
  if (!hasDevKeys) {
    console.log('\n📝 Pour ajouter vos nouvelles clés Clerk de développement:');
    console.log('Ajoutez ces lignes à votre fichier .env.local:\n');
    console.log('# Nouvelles clés Clerk pour développement');
    console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV=pk_test_votre_nouvelle_cle_publique');
    console.log('CLERK_SECRET_KEY_DEV=sk_test_votre_nouvelle_cle_secrete\n');
  }
} else {
  console.log('📁 Fichier .env.local non trouvé');
  console.log('📝 Créez un fichier .env.local avec le contenu suivant:\n');
  console.log('# Clés Clerk de production (existantes)');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_votre_cle_production');
  console.log('CLERK_SECRET_KEY=sk_test_votre_cle_production_secrete');
  console.log('');
  console.log('# Nouvelles clés Clerk pour développement');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV=pk_test_votre_nouvelle_cle_publique');
  console.log('CLERK_SECRET_KEY_DEV=sk_test_votre_nouvelle_cle_secrete');
  console.log('');
  console.log('# Autres variables');
  console.log('MONGODB_URI=votre_uri_mongodb');
  console.log('BLOB_READ_WRITE_TOKEN=votre_token_blob\n');
}

console.log('🚀 Instructions:');
console.log('1. En développement, l\'app utilisera automatiquement les clés _DEV');
console.log('2. En production, l\'app utilisera les clés de production');
console.log('3. Redémarrez votre serveur de développement après modification');
console.log('4. Vérifiez la configuration dans la console du navigateur\n');

console.log('🔍 Pour tester la configuration:');
console.log('npm run dev');
console.log('Puis vérifiez les logs dans la console du navigateur');


