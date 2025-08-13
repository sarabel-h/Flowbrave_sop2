#!/usr/bin/env node

/**
 * 🚀 Script de test des performances du Copilot
 */

const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  testQueries: [
    "Comment créer un nouveau SOP?",
    "Quelles sont les étapes pour l'onboarding?",
    "Comment gérer les permissions utilisateur?"
  ],
  iterations: 3
};

const testResults = {
  timestamp: new Date().toISOString(),
  apiResponseTimes: [],
  errors: []
};

async function testChatRequest(query) {
  console.log(`🧪 Test: "${query.substring(0, 30)}..."`);
  
  const startTime = Date.now();
  
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

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      testResults.apiResponseTimes.push(duration);
      console.log(`✅ ${duration}ms`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.errors.push({ query, error: error.message, duration });
    console.log(`❌ ${error.message} (${duration}ms)`);
  }
}

function generateReport() {
  console.log('\n🚀 RAPPORT DE PERFORMANCE');
  console.log('========================\n');

  if (testResults.apiResponseTimes.length > 0) {
    const times = testResults.apiResponseTimes;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`📡 Temps de réponse API:`);
    console.log(`   Moyenne: ${avg.toFixed(2)}ms`);
    console.log(`   Min/Max: ${min}ms / ${max}ms`);
    console.log(`   Requêtes: ${times.length}\n`);
  }

  if (testResults.errors.length > 0) {
    console.log(`❌ Erreurs: ${testResults.errors.length}`);
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  for (let i = 0; i < CONFIG.iterations; i++) {
    console.log(`--- Itération ${i + 1}/${CONFIG.iterations} ---`);
    
    for (const query of CONFIG.testQueries) {
      await testChatRequest(query);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  generateReport();
  console.log('✅ Tests terminés');
}

if (require.main === module) {
  runTests().catch(console.error);
} 