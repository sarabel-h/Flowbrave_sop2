// 🚀 SCRIPT D'ANALYSE DES LOGS DE PROFILING
// Usage: node scripts/analyze-profiling.js <log-file>

const fs = require('fs');
const path = require('path');

// Fonction pour parser les logs de profiling
function parseProfilingLogs(logContent) {
  const lines = logContent.split('\n');
  const events = [];
  
  for (const line of lines) {
    // Parser les événements START
    const startMatch = line.match(/\[([^\]]+)\] START: (.+)/);
    if (startMatch) {
      events.push({
        type: 'start',
        category: startMatch[1],
        step: startMatch[2],
        timestamp: Date.now() // Approximation
      });
      continue;
    }
    
    // Parser les événements END
    const endMatch = line.match(/\[([^\]]+)\] END: (.+) - ([\d.]+)ms/);
    if (endMatch) {
      events.push({
        type: 'end',
        category: endMatch[1],
        step: endMatch[2],
        duration: parseFloat(endMatch[3]),
        timestamp: Date.now() // Approximation
      });
      continue;
    }
    
    // Parser les étapes
    const stepMatch = line.match(/\[([^\]]+)\] STEP: (.+) - ([\d.]+)ms/);
    if (stepMatch) {
      events.push({
        type: 'step',
        category: stepMatch[1],
        step: stepMatch[2],
        duration: parseFloat(stepMatch[3]),
        timestamp: Date.now() // Approximation
      });
    }
  }
  
  return events;
}

// Fonction pour analyser les performances par catégorie
function analyzeByCategory(events) {
  const categories = {};
  
  for (const event of events) {
    if (!categories[event.category]) {
      categories[event.category] = {
        steps: {},
        totalDuration: 0,
        count: 0
      };
    }
    
    if (event.type === 'step') {
      if (!categories[event.category].steps[event.step]) {
        categories[event.category].steps[event.step] = {
          durations: [],
          count: 0,
          totalDuration: 0
        };
      }
      
      categories[event.category].steps[event.step].durations.push(event.duration);
      categories[event.category].steps[event.step].count++;
      categories[event.category].steps[event.step].totalDuration += event.duration;
      categories[event.category].totalDuration += event.duration;
      categories[event.category].count++;
    }
  }
  
  return categories;
}

// Fonction pour calculer les statistiques
function calculateStats(durations) {
  if (durations.length === 0) return null;
  
  const sorted = durations.sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return {
    count: durations.length,
    total: sum,
    average: avg,
    min: min,
    max: max,
    median: median,
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

// Fonction pour générer le rapport
function generateReport(categories) {
  let report = '# RAPPORT DE PROFILING DU COPILOTE\n\n';
  report += `**Généré le:** ${new Date().toLocaleString()}\n\n`;
  
  // Résumé global
  report += '## RÉSUMÉ GLOBAL\n\n';
  let totalDuration = 0;
  let totalSteps = 0;
  
  for (const [category, data] of Object.entries(categories)) {
    totalDuration += data.totalDuration;
    totalSteps += data.count;
  }
  
  report += `- **Durée totale mesurée:** ${totalDuration.toFixed(2)}ms\n`;
  report += `- **Nombre total d'étapes:** ${totalSteps}\n`;
  report += `- **Durée moyenne par étape:** ${(totalDuration / totalSteps).toFixed(2)}ms\n\n`;
  
  // Analyse par catégorie
  report += '## ANALYSE PAR CATÉGORIE\n\n';
  
  for (const [category, data] of Object.entries(categories)) {
    report += `### ${category.toUpperCase()}\n\n`;
    report += `- **Durée totale:** ${data.totalDuration.toFixed(2)}ms\n`;
    report += `- **Nombre d'étapes:** ${data.count}\n`;
    report += `- **Durée moyenne:** ${(data.totalDuration / data.count).toFixed(2)}ms\n\n`;
    
    // Détail des étapes
    report += '#### Détail des étapes:\n\n';
    report += '| Étape | Compte | Total (ms) | Moyenne (ms) | Min (ms) | Max (ms) | P95 (ms) |\n';
    report += '|-------|--------|------------|--------------|----------|----------|----------|\n';
    
    for (const [step, stepData] of Object.entries(data.steps)) {
      const stats = calculateStats(stepData.durations);
      if (stats) {
        report += `| ${step} | ${stats.count} | ${stats.total.toFixed(2)} | ${stats.average.toFixed(2)} | ${stats.min.toFixed(2)} | ${stats.max.toFixed(2)} | ${stats.p95.toFixed(2)} |\n`;
      }
    }
    report += '\n';
  }
  
  // Identification des goulots d'étranglement
  report += '## IDENTIFICATION DES GOULOTS D\'ÉTRANGLEMENT\n\n';
  
  const bottlenecks = [];
  for (const [category, data] of Object.entries(categories)) {
    for (const [step, stepData] of Object.entries(data.steps)) {
      const stats = calculateStats(stepData.durations);
      if (stats && stats.average > 1000) { // Plus de 1 seconde
        bottlenecks.push({
          category,
          step,
          average: stats.average,
          count: stats.count,
          total: stats.total
        });
      }
    }
  }
  
  if (bottlenecks.length > 0) {
    bottlenecks.sort((a, b) => b.average - a.average);
    
    report += '### Étapes lentes (> 1000ms en moyenne):\n\n';
    report += '| Catégorie | Étape | Moyenne (ms) | Compte | Total (ms) |\n';
    report += '|-----------|-------|--------------|--------|------------|\n';
    
    for (const bottleneck of bottlenecks) {
      report += `| ${bottleneck.category} | ${bottleneck.step} | ${bottleneck.average.toFixed(2)} | ${bottleneck.count} | ${bottleneck.total.toFixed(2)} |\n`;
    }
    report += '\n';
  } else {
    report += 'Aucun goulot d\'étranglement majeur détecté (toutes les étapes < 1000ms en moyenne)\n\n';
  }
  
  // Recommandations d'optimisation
  report += '## RECOMMANDATIONS D\'OPTIMISATION\n\n';
  
  const recommendations = [];
  
  // Analyser les embeddings
  const embeddingSteps = categories['PROFILING']?.steps || {};
  if (embeddingSteps['generateEmbedding (new)']) {
    const stats = calculateStats(embeddingSteps['generateEmbedding (new)'].durations);
    if (stats && stats.average > 500) {
      recommendations.push('**Embeddings:** Considérer un cache Redis pour les embeddings fréquents');
    }
  }
  
  // Analyser la recherche vectorielle
  if (embeddingSteps['searchSimilarContent - vector search']) {
    const stats = calculateStats(embeddingSteps['searchSimilarContent - vector search'].durations);
    if (stats && stats.average > 300) {
      recommendations.push('**Recherche vectorielle:** Optimiser les index MongoDB ou implémenter un cache de résultats');
    }
  }
  
  // Analyser les appels LLM
  if (embeddingSteps['generateChatResponse - model invocation']) {
    const stats = calculateStats(embeddingSteps['generateChatResponse - model invocation'].durations);
    if (stats && stats.average > 2000) {
      recommendations.push('**LLM:** Considérer un modèle plus rapide ou optimiser les prompts');
    }
  }
  
  // Analyser les connexions DB
  if (embeddingSteps['searchSimilarContent - DB connection']) {
    const stats = calculateStats(embeddingSteps['searchSimilarContent - DB connection'].durations);
    if (stats && stats.average > 100) {
      recommendations.push('**Connexions DB:** Implémenter un pool de connexions MongoDB');
    }
  }
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  } else {
    report += 'Aucune recommandation majeure - les performances semblent bonnes\n';
  }
  
  report += '\n';
  
  return report;
}

// Fonction principale
function analyzeProfilingLogs(logFilePath) {
  try {
    console.log(`Lecture du fichier de logs: ${logFilePath}`);
    
    if (!fs.existsSync(logFilePath)) {
      console.error(`Fichier non trouvé: ${logFilePath}`);
      return;
    }
    
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    console.log(`Fichier lu (${logContent.length} caractères)`);
    
    // Parser les logs
    console.log('Parsing des événements de profiling...');
    const events = parseProfilingLogs(logContent);
    console.log(`${events.length} événements parsés`);
    
    // Analyser par catégorie
    console.log('Analyse par catégorie...');
    const categories = analyzeByCategory(events);
    console.log(`${Object.keys(categories).length} catégories analysées`);
    
    // Générer le rapport
    console.log('Génération du rapport...');
    const report = generateReport(categories);
    
    // Sauvegarder le rapport
    const reportPath = path.join(path.dirname(logFilePath), 'profiling-report.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`Rapport sauvegardé: ${reportPath}`);
    
    // Afficher un résumé
    console.log('\nRÉSUMÉ:');
    for (const [category, data] of Object.entries(categories)) {
      console.log(`  ${category}: ${data.totalDuration.toFixed(2)}ms (${data.count} étapes)`);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const logFile = process.argv[2];
  if (!logFile) {
    console.log('Usage: node scripts/analyze-profiling.js <log-file>');
    console.log('Exemple: node scripts/analyze-profiling.js logs/profiling.log');
    process.exit(1);
  }
  
  analyzeProfilingLogs(logFile);
}

module.exports = {
  parseProfilingLogs,
  analyzeByCategory,
  calculateStats,
  generateReport,
  analyzeProfilingLogs
}; 