#!/usr/bin/env node

/**
 * 🚀 Script de benchmark des performances du Copilot
 * Mesure les temps de réponse et génère un rapport détaillé
 */

const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  testQueries: [
    "Comment créer un nouveau SOP?",
    "Quelles sont les étapes pour l'onboarding?",
    "Comment gérer les permissions utilisateur?",
    "Qu'est-ce qu'un SOP?",
    "Comment modifier un SOP existant?"
  ],
  iterations: 5,
  delayBetweenRequests: 2000 // 2 secondes entre les requêtes
};

const benchmarkResults = {
  timestamp: new Date().toISOString(),
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  detailedMetrics: {
    min: 0,
    max: 0,
    average: 0,
    median: 0,
    p95: 0,
    p99: 0
  }
};

async function measureResponseTime(query, iteration) {
  console.log(`🧪 Test ${iteration}: "${query.substring(0, 40)}..."`);
  
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

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    benchmarkResults.totalRequests++;
    
    if (response.ok) {
      benchmarkResults.successfulRequests++;
      benchmarkResults.responseTimes.push(duration);
      
      const data = await response.json();
      console.log(`✅ ${duration.toFixed(2)}ms - Réponse: ${data.response?.substring(0, 50)}...`);
      
      return {
        success: true,
        duration,
        responseLength: data.response?.length || 0
      };
    } else {
      benchmarkResults.failedRequests++;
      const errorText = await response.text();
      benchmarkResults.errors.push({ 
        query, 
        status: response.status, 
        error: errorText,
        duration 
      });
      console.log(`❌ HTTP ${response.status} (${duration.toFixed(2)}ms) - ${errorText.substring(0, 50)}`);
      
      return {
        success: false,
        duration,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    benchmarkResults.totalRequests++;
    benchmarkResults.failedRequests++;
    benchmarkResults.errors.push({ 
      query, 
      error: error.message, 
      duration 
    });
    
    console.log(`❌ Erreur réseau (${duration.toFixed(2)}ms) - ${error.message}`);
    
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}

function calculateMetrics() {
  if (benchmarkResults.responseTimes.length === 0) {
    return;
  }
  
  const times = benchmarkResults.responseTimes.sort((a, b) => a - b);
  const count = times.length;
  
  benchmarkResults.detailedMetrics = {
    min: times[0],
    max: times[count - 1],
    average: times.reduce((a, b) => a + b, 0) / count,
    median: count % 2 === 0 ? (times[count/2 - 1] + times[count/2]) / 2 : times[Math.floor(count/2)],
    p95: times[Math.floor(count * 0.95)],
    p99: times[Math.floor(count * 0.99)]
  };
}

function generateDetailedReport() {
  console.log('\nRAPPORT DE PERFORMANCE DÉTAILLÉ');
  console.log('===================================\n');
  
  console.log(`MÉTRIQUES GÉNÉRALES:`);
  console.log(`   Requêtes totales: ${benchmarkResults.totalRequests}`);
  console.log(`   Succès: ${benchmarkResults.successfulRequests}`);
  console.log(`   Échecs: ${benchmarkResults.failedRequests}`);
  console.log(`   Taux de succès: ${((benchmarkResults.successfulRequests / benchmarkResults.totalRequests) * 100).toFixed(1)}%\n`);
  
  if (benchmarkResults.responseTimes.length > 0) {
    const metrics = benchmarkResults.detailedMetrics;
    
    console.log(`TEMPS DE RÉPONSE (en millisecondes):`);
    console.log(`   Minimum: ${metrics.min.toFixed(2)}ms`);
    console.log(`   Maximum: ${metrics.max.toFixed(2)}ms`);
    console.log(`   Moyenne: ${metrics.average.toFixed(2)}ms`);
    console.log(`   Médiane: ${metrics.median.toFixed(2)}ms`);
    console.log(`   95ème percentile: ${metrics.p95.toFixed(2)}ms`);
    console.log(`   99ème percentile: ${metrics.p99.toFixed(2)}ms\n`);
    
    // Évaluation de la performance
    console.log(`ÉVALUATION DE LA PERFORMANCE:`);
    if (metrics.average < 2000) {
      console.log(`   EXCELLENT: Temps de réponse moyen < 2s`);
    } else if (metrics.average < 5000) {
      console.log(`   BON: Temps de réponse moyen entre 2-5s`);
    } else {
      console.log(`   LENT: Temps de réponse moyen > 5s`);
    }
    
    if (metrics.p95 < 5000) {
      console.log(`   EXCELLENT: 95% des requêtes < 5s`);
    } else if (metrics.p95 < 10000) {
      console.log(`   ACCEPTABLE: 95% des requêtes < 10s`);
    } else {
      console.log(`   LENT: 95% des requêtes > 10s`);
    }
  }
  
  if (benchmarkResults.errors.length > 0) {
    console.log(`\nERREURS DÉTECTÉES:`);
    benchmarkResults.errors.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.error} (${error.duration?.toFixed(2)}ms)`);
    });
    if (benchmarkResults.errors.length > 5) {
      console.log(`   ... et ${benchmarkResults.errors.length - 5} autres erreurs`);
    }
  }
  
  console.log(`\nTimestamp: ${benchmarkResults.timestamp}`);
}

async function runBenchmark() {
  console.log('Démarrage du benchmark de performance...\n');
  console.log(`Configuration:`);
  console.log(`   URL: ${CONFIG.baseUrl}`);
  console.log(`   Requêtes de test: ${CONFIG.testQueries.length}`);
  console.log(`   Itérations: ${CONFIG.iterations}`);
  console.log(`   Total de requêtes: ${CONFIG.testQueries.length * CONFIG.iterations}\n`);
  
  for (let i = 0; i < CONFIG.iterations; i++) {
    console.log(`--- Itération ${i + 1}/${CONFIG.iterations} ---`);
    
    for (const query of CONFIG.testQueries) {
      await measureResponseTime(query, i + 1);
      
      if (i < CONFIG.iterations - 1 || query !== CONFIG.testQueries[CONFIG.testQueries.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
      }
    }
  }
  
  calculateMetrics();
  generateDetailedReport();
  
  // Sauvegarder les résultats
  const fs = require('fs');
  const resultsFile = `performance-results-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(benchmarkResults, null, 2));
  console.log(`\nRésultats sauvegardés dans: ${resultsFile}`);
  
  console.log('\nBenchmark terminé');
}

if (require.main === module) {
  runBenchmark().catch(console.error);
} 