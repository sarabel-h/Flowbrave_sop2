#!/usr/bin/env node

/**
 * Script de test des performances de la recherche vectorielle
 * 
 * Ce script permet de tester et mesurer les performances de la recherche
 * vectorielle avec différents types de requêtes.
 */

import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'Opus';
const COLLECTION_NAME = 'sop';

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Requêtes de test
const TEST_QUERIES = [
  "Comment créer un nouveau SOP?",
  "Procédure d'onboarding des employés",
  "Gestion des incidents de sécurité",
  "Comment configurer les permissions utilisateur?",
  "Processus de validation des documents",
  "Guide de maintenance des systèmes",
  "Procédure de sauvegarde des données",
  "Comment gérer les demandes de support?",
  "Processus d'audit qualité",
  "Guide de formation des nouveaux employés"
];

// Fonction pour générer un embedding
async function generateEmbedding(content) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

// Fonction pour tester la recherche vectorielle
async function testVectorSearch(query, organization = "test-org") {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // Générer l'embedding de la requête
    const queryVector = await generateEmbedding(query);
    
    // Mesurer le temps de recherche
    const startTime = performance.now();
    
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: "sop_vector_index",
          path: "contentVector",
          queryVector: queryVector,
          numCandidates: 50,
          limit: 10
        }
      },
      {
        $match: { organization }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]).toArray();
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    return {
      query,
      results: results.length,
      searchTime: searchTime.toFixed(2),
      topScore: results[0]?.score || 0,
      averageScore: results.length > 0 ? 
        (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(3) : 0
    };
    
  } finally {
    await client.close();
  }
}

// Fonction pour tester la recherche hybride
async function testHybridSearch(query, organization = "test-org") {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // Générer l'embedding de la requête
    const queryVector = await generateEmbedding(query);
    
    // Mesurer le temps de recherche hybride
    const startTime = performance.now();
    
    // Recherche vectorielle
    const vectorResults = await collection.aggregate([
      {
        $vectorSearch: {
          index: "sop_vector_index",
          path: "contentVector",
          queryVector: queryVector,
          numCandidates: 50,
          limit: 20
        }
      },
      {
        $match: { organization }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          score: { $meta: "vectorSearchScore" },
          searchType: { $literal: "vector" }
        }
      }
    ]).toArray();
    
    // Recherche textuelle (si l'index existe)
    let textResults = [];
    try {
      textResults = await collection.aggregate([
        {
          $search: {
            index: "sop_text_index",
            compound: {
              should: [
                {
                  text: {
                    query: query,
                    path: ["title", "content"],
                    fuzzy: { maxEdits: 1 }
                  }
                }
              ]
            }
          }
        },
        {
          $match: { organization }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            score: { $meta: "searchScore" },
            searchType: { $literal: "text" }
          }
        },
        { $limit: 10 }
      ]).toArray();
    } catch (error) {
      console.log(`Index textuel non disponible: ${error.message}`);
    }
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    // Combiner les résultats
    const allResults = [...vectorResults, ...textResults];
    const uniqueResults = new Map();
    
    for (const doc of allResults) {
      const docId = doc._id.toString();
      if (!uniqueResults.has(docId)) {
        uniqueResults.set(docId, doc);
      } else {
        // Prendre le meilleur score
        const existing = uniqueResults.get(docId);
        if (doc.score > existing.score) {
          uniqueResults.set(docId, doc);
        }
      }
    }
    
    const finalResults = Array.from(uniqueResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return {
      query,
      vectorResults: vectorResults.length,
      textResults: textResults.length,
      combinedResults: finalResults.length,
      searchTime: searchTime.toFixed(2),
      topScore: finalResults[0]?.score || 0,
      averageScore: finalResults.length > 0 ? 
        (finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length).toFixed(3) : 0
    };
    
  } finally {
    await client.close();
  }
}

// Fonction principale de test
async function runPerformanceTests() {
  console.log('Démarrage des tests de performance de recherche vectorielle...\n');
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI non définie');
    process.exit(1);
  }
  
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY non définie');
    process.exit(1);
  }
  
  const results = {
    vectorSearch: [],
    hybridSearch: []
  };
  
  // Test de recherche vectorielle
  console.log('Test de recherche vectorielle...');
  for (const query of TEST_QUERIES) {
    console.log(`  Test: "${query}"`);
    const result = await testVectorSearch(query);
    results.vectorSearch.push(result);
    console.log(`    Résultats: ${result.results}, Temps: ${result.searchTime}ms, Score max: ${result.topScore}`);
  }
  
  // Test de recherche hybride
  console.log('\nTest de recherche hybride...');
  for (const query of TEST_QUERIES) {
    console.log(`  Test: "${query}"`);
    const result = await testHybridSearch(query);
    results.hybridSearch.push(result);
    console.log(`    Vector: ${result.vectorResults}, Text: ${result.textResults}, Temps: ${result.searchTime}ms`);
  }
  
  // Calculer les statistiques
  const vectorStats = calculateStats(results.vectorSearch);
  const hybridStats = calculateStats(results.hybridSearch);
  
  // Afficher le rapport
  console.log('\nRAPPORT DE PERFORMANCE');
  console.log('='.repeat(50));
  
  console.log('\nRecherche Vectorielle:');
  console.log(`  Temps moyen: ${vectorStats.avgTime}ms`);
  console.log(`  Temps min: ${vectorStats.minTime}ms`);
  console.log(`  Temps max: ${vectorStats.maxTime}ms`);
  console.log(`  Résultats moyens: ${vectorStats.avgResults}`);
  console.log(`  Score moyen: ${vectorStats.avgScore}`);
  
  console.log('\n🔗 Recherche Hybride:');
  console.log(`  Temps moyen: ${hybridStats.avgTime}ms`);
  console.log(`  Temps min: ${hybridStats.minTime}ms`);
  console.log(`  Temps max: ${hybridStats.maxTime}ms`);
  console.log(`  Résultats moyens: ${hybridStats.avgResults}`);
  console.log(`  Score moyen: ${hybridStats.avgScore}`);
  
  console.log('\n📊 Comparaison:');
  const timeImprovement = ((vectorStats.avgTime - hybridStats.avgTime) / vectorStats.avgTime * 100).toFixed(1);
  const scoreImprovement = ((hybridStats.avgScore - vectorStats.avgScore) / vectorStats.avgScore * 100).toFixed(1);
  
  console.log(`  Amélioration temps: ${timeImprovement}%`);
  console.log(`  Amélioration score: ${scoreImprovement}%`);
  
  console.log('\n✅ Tests terminés!');
}

// Fonction utilitaire pour calculer les statistiques
function calculateStats(results) {
  const times = results.map(r => parseFloat(r.searchTime));
  const scores = results.map(r => parseFloat(r.averageScore));
  const resultCounts = results.map(r => r.results || r.combinedResults);
  
  return {
    avgTime: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
    minTime: Math.min(...times).toFixed(2),
    maxTime: Math.max(...times).toFixed(2),
    avgResults: (resultCounts.reduce((a, b) => a + b, 0) / resultCounts.length).toFixed(1),
    avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)
  };
}

// Exécution du script
runPerformanceTests().catch(console.error); 