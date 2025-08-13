#!/usr/bin/env node

/**
 * 🚀 Script d'analyse des performances du Copilot
 * 
 * Ce script analyse les performances de différentes parties du système :
 * - Temps de réponse des API
 * - Utilisation de la mémoire
 * - Performance des embeddings
 * - Temps de recherche vectorielle
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  logFile: path.join(__dirname, '../logs/performance.log'),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  retentionDays: 7
};

// Métriques de performance
const metrics = {
  apiResponseTimes: [],
  embeddingGenerationTimes: [],
  vectorSearchTimes: [],
  memoryUsage: [],
  cacheHitRates: []
};

/**
 * Analyse les logs de performance
 */
function analyzePerformanceLogs() {
  try {
    if (!fs.existsSync(CONFIG.logFile)) {
      console.log('❌ Aucun fichier de log trouvé');
      return;
    }

    const logContent = fs.readFileSync(CONFIG.logFile, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());

    console.log(`📊 Analyse de ${lines.length} lignes de log...`);

    // Analyser les métriques
    lines.forEach(line => {
      if (line.includes('[PROFILING]')) {
        parseProfilingLine(line);
      } else if (line.includes('[API PROFILING]')) {
        parseApiProfilingLine(line);
      } else if (line.includes('[STREAMING PROFILING]')) {
        parseStreamingProfilingLine(line);
      }
    });

    // Générer le rapport
    generatePerformanceReport();

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

/**
 * Parse une ligne de profiling
 */
function parseProfilingLine(line) {
  const match = line.match(/STEP: (.+?) - ([\d.]+)ms/);
  if (match) {
    const [, step, duration] = match;
    const time = parseFloat(duration);

    if (step.includes('embedding')) {
      metrics.embeddingGenerationTimes.push(time);
    } else if (step.includes('search')) {
      metrics.vectorSearchTimes.push(time);
    }
  }
}

/**
 * Parse une ligne de profiling API
 */
function parseApiProfilingLine(line) {
  const match = line.match(/STEP: (.+?) - ([\d.]+)ms/);
  if (match) {
    const [, step, duration] = match;
    const time = parseFloat(duration);

    if (step.includes('Total Request')) {
      metrics.apiResponseTimes.push(time);
    }
  }
}

/**
 * Parse une ligne de profiling streaming
 */
function parseStreamingProfilingLine(line) {
  const match = line.match(/STEP: (.+?) - ([\d.]+)ms/);
  if (match) {
    const [, step, duration] = match;
    const time = parseFloat(duration);

    if (step.includes('Total Request')) {
      metrics.apiResponseTimes.push(time);
    }
  }
}

/**
 * Calcule les statistiques d'un tableau de valeurs
 */
function calculateStats(values) {
  if (values.length === 0) return null;

  const sorted = values.sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return {
    count: values.length,
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
    p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2)
  };
}

/**
 * Génère le rapport de performance
 */
function generatePerformanceReport() {
  console.log('\n🚀 RAPPORT DE PERFORMANCE DU COPILOT');
  console.log('=====================================\n');

  // Temps de réponse API
  const apiStats = calculateStats(metrics.apiResponseTimes);
  if (apiStats) {
    console.log('📡 TEMPS DE RÉPONSE API:');
    console.log(`   Nombre de requêtes: ${apiStats.count}`);
    console.log(`   Moyenne: ${apiStats.mean}ms`);
    console.log(`   Médiane: ${apiStats.median}ms`);
    console.log(`   Min/Max: ${apiStats.min}ms / ${apiStats.max}ms`);
    console.log(`   P95: ${apiStats.p95}ms`);
    console.log(`   P99: ${apiStats.p99}ms\n`);
  }

  // Génération d'embeddings
  const embeddingStats = calculateStats(metrics.embeddingGenerationTimes);
  if (embeddingStats) {
    console.log('GÉNÉRATION D\'EMBEDDINGS:');
    console.log(`   Nombre d'embeddings: ${embeddingStats.count}`);
    console.log(`   Moyenne: ${embeddingStats.mean}ms`);
    console.log(`   Médiane: ${embeddingStats.median}ms`);
    console.log(`   Min/Max: ${embeddingStats.min}ms / ${embeddingStats.max}ms\n`);
  }

  // Recherche vectorielle
  const searchStats = calculateStats(metrics.vectorSearchTimes);
  if (searchStats) {
    console.log('RECHERCHE VECTORIELLE:');
    console.log(`   Nombre de recherches: ${searchStats.count}`);
    console.log(`   Moyenne: ${searchStats.mean}ms`);
    console.log(`   Médiane: ${searchStats.median}ms`);
    console.log(`   Min/Max: ${searchStats.min}ms / ${searchStats.max}ms\n`);
  }

  // Recommandations
  generateRecommendations(apiStats, embeddingStats, searchStats);
}

/**
 * Génère des recommandations d'optimisation
 */
function generateRecommendations(apiStats, embeddingStats, searchStats) {
  console.log('RECOMMANDATIONS D\'OPTIMISATION:');
  console.log('==================================\n');

  // Recommandations basées sur les temps de réponse API
  if (apiStats && parseFloat(apiStats.p95) > 5000) {
    console.log('Temps de réponse API élevé (>5s P95):');
    console.log('   - Optimiser les requêtes MongoDB');
    console.log('   - Réduire la taille des contextes');
    console.log('   - Utiliser le streaming pour les réponses longues');
    console.log('   - Implémenter du caching côté serveur\n');
  }

  // Recommandations basées sur les embeddings
  if (embeddingStats && parseFloat(embeddingStats.mean) > 1000) {
    console.log('Génération d\'embeddings lente (>1s moyenne):');
    console.log('   - Améliorer le cache des embeddings');
    console.log('   - Réduire la taille des textes');
    console.log('   - Utiliser des embeddings pré-calculés');
    console.log('   - Optimiser les appels API OpenAI\n');
  }

  // Recommandations basées sur la recherche vectorielle
  if (searchStats && parseFloat(searchStats.mean) > 500) {
    console.log('Recherche vectorielle lente (>500ms moyenne):');
    console.log('   - Optimiser les index MongoDB');
    console.log('   - Réduire le nombre de candidats');
    console.log('   - Améliorer les filtres de recherche');
    console.log('   - Utiliser des index composites\n');
  }

  // Recommandations générales
  console.log('OPTIMISATIONS GÉNÉRALES:');
  console.log('   - Activer la compression gzip');
  console.log('   - Optimiser les images et assets');
  console.log('   - Utiliser le lazy loading des composants');
  console.log('   - Implémenter du caching HTTP');
  console.log('   - Monitorer l\'utilisation mémoire');
  console.log('   - Optimiser les requêtes de base de données\n');
}

/**
 * Nettoie les anciens logs
 */
function cleanupOldLogs() {
  try {
    if (fs.existsSync(CONFIG.logFile)) {
      const stats = fs.statSync(CONFIG.logFile);
      const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysOld > CONFIG.retentionDays) {
        fs.unlinkSync(CONFIG.logFile);
        console.log('Anciens logs supprimés');
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}

// Point d'entrée
if (require.main === module) {
  console.log('Démarrage de l\'analyse des performances...\n');
  
  cleanupOldLogs();
  analyzePerformanceLogs();
  
  console.log('Analyse terminée');
}

module.exports = {
  analyzePerformanceLogs,
  generatePerformanceReport,
  cleanupOldLogs
};