#!/usr/bin/env node

/**
 * 🧪 Test des performances sans OpenAI
 * Mesure les temps de base (recherche, embeddings, etc.)
 */

const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  testQueries: [
    "test simple",
    "recherche basique",
    "requête courte"
  ],
  iterations: 3
};

async function testWithoutOpenAI() {
  console.log('🧪 Test des performances de base (sans OpenAI)...\n');
  
  for (let i = 0; i < CONFIG.iterations; i++) {
    console.log(`--- Test ${i + 1}/${CONFIG.iterations} ---`);
    
    for (const query of CONFIG.testQueries) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(`${CONFIG.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            organization: 'test-org',
            user: 'test@example.com',
            role: 'admin',
            history: []
          })
        });

        const duration = performance.now() - startTime;
        
        if (response.ok) {
          console.log(`✅ ${duration.toFixed(2)}ms - Succès`);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${duration.toFixed(2)}ms - HTTP ${response.status}: ${errorText.substring(0, 50)}`);
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        console.log(`❌ ${duration.toFixed(2)}ms - Erreur: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📊 ANALYSE:');
  console.log('- Les temps de 3-5 secondes incluent:');
  console.log('  • Recherche vectorielle MongoDB');
  console.log('  • Génération d\'embeddings (si pas en cache)');
  console.log('  • Tentative d\'appel OpenAI (qui échoue)');
  console.log('  • Gestion d\'erreur et fallback');
  console.log('\n- Pour améliorer:');
  console.log('  1. Configurer OPENAI_API_KEY');
  console.log('  2. Optimiser la recherche vectorielle');
  console.log('  3. Améliorer le cache des embeddings');
}

if (require.main === module) {
  testWithoutOpenAI().catch(console.error);
} 