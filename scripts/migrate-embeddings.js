#!/usr/bin/env node

/**
 * Script de migration des embeddings vers le nouveau modèle text-embedding-3-small
 * 
 * Ce script met à jour tous les embeddings existants dans la base de données
 * pour utiliser le nouveau modèle plus performant.
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

// Cache pour éviter de régénérer les mêmes embeddings
const embeddingCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

// Fonction pour générer un embedding avec le nouveau modèle
async function generateNewEmbedding(content) {
  const cacheKey = content.toLowerCase().trim();
  const cached = embeddingCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("🚀 Using cached embedding");
    return cached.embedding;
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
      dimensions: 1536,
    });
    
    const embedding = response.data[0].embedding;
    
    // Mettre en cache
    embeddingCache.set(cacheKey, {
      embedding,
      timestamp: Date.now()
    });
    
    return embedding;
  } catch (error) {
    console.error("❌ Erreur lors de la génération d'embedding:", error.message);
    throw error;
  }
}

// Fonction pour nettoyer le contenu HTML
function stripHtml(htmlContent) {
  return htmlContent.replace(/<[^>]*>/g, '').trim();
}

// Fonction principale de migration
async function migrateEmbeddings() {
  console.log('🚀 Démarrage de la migration des embeddings...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI non définie');
    process.exit(1);
  }
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY non définie');
    process.exit(1);
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion à MongoDB établie');
    
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // Compter les documents à migrer
    const totalDocuments = await collection.countDocuments({
      $or: [
        { contentVector: { $exists: true } },
        { content: { $exists: true } }
      ]
    });
    
    console.log(`Total des documents à traiter: ${totalDocuments}`);
    
    if (totalDocuments === 0) {
      console.log('Aucun document à migrer');
      return;
    }
    
    // Demander confirmation
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`Voulez-vous continuer avec la migration de ${totalDocuments} documents? (y/N): `, resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Migration annulée');
      return;
    }
    
    // Récupérer tous les documents
    const documents = await collection.find({
      $or: [
        { contentVector: { $exists: true } },
        { content: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`\nDébut de la migration de ${documents.length} documents...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const progress = ((i + 1) / documents.length * 100).toFixed(1);
      
      console.log(`[${progress}%] Traitement du document ${i + 1}/${documents.length}: ${doc.title || doc._id}`);
      
      try {
        // Vérifier si le document a du contenu
        if (!doc.content) {
          console.log(`  Pas de contenu, ignoré`);
          skippedCount++;
          continue;
        }
        
        // Nettoyer le contenu HTML
        const cleanContent = stripHtml(doc.content);
        
        if (!cleanContent.trim()) {
          console.log(`  Contenu vide après nettoyage, ignoré`);
          skippedCount++;
          continue;
        }
        
        // Générer le nouvel embedding
        console.log(`  Génération du nouvel embedding...`);
        const newEmbedding = await generateNewEmbedding(cleanContent);
        
        // Mettre à jour le document
        await collection.updateOne(
          { _id: doc._id },
          { 
            $set: { 
              contentVector: newEmbedding,
              embeddingModel: "text-embedding-3-small",
              embeddingUpdatedAt: new Date()
            }
          }
        );
        
        console.log(`  Embedding mis à jour`);
        successCount++;
        
        // Pause pour éviter de dépasser les limites API
        if ((i + 1) % 10 === 0) {
          console.log(`  Pause de 1 seconde...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`  Erreur: ${error.message}`);
        errorCount++;
        
        // En cas d'erreur API, attendre plus longtemps
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          console.log(`  Pause de 10 secondes pour respecter les limites API...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
    
    // Afficher le rapport final
    console.log('\nRAPPORT DE MIGRATION');
    console.log('='.repeat(50));
    console.log(`Succès: ${successCount}`);
    console.log(`Erreurs: ${errorCount}`);
    console.log(`Ignorés: ${skippedCount}`);
    console.log(`Total: ${documents.length}`);
    
    if (successCount > 0) {
      console.log('\nMigration terminée avec succès!');
      console.log('\nProchaines étapes:');
      console.log('  1. Vérifiez que les nouveaux embeddings fonctionnent');
      console.log('  2. Testez la recherche vectorielle');
      console.log('  3. Surveillez les performances');
    } else {
      console.log('\nAucun document n\'a été migré');
    }
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await client.close();
    console.log('\nConnexion MongoDB fermée');
  }
}

// Fonction pour vérifier les embeddings existants
async function checkEmbeddings() {
  console.log('Vérification des embeddings existants...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // Compter les documents avec embeddings
    const withEmbeddings = await collection.countDocuments({
      contentVector: { $exists: true }
    });
    
    // Compter les documents avec contenu mais sans embeddings
    const withoutEmbeddings = await collection.countDocuments({
      content: { $exists: true },
      contentVector: { $exists: false }
    });
    
    // Vérifier le modèle d'embedding utilisé
    const embeddingModels = await collection.distinct('embeddingModel');
    
    console.log('Statistiques des embeddings:');
    console.log(`  Documents avec embeddings: ${withEmbeddings}`);
    console.log(`  Documents sans embeddings: ${withoutEmbeddings}`);
    console.log(`  Modèles utilisés: ${embeddingModels.join(', ') || 'Aucun'}`);
    
    if (withEmbeddings > 0) {
      // Échantillon de documents
      const sample = await collection.find({
        contentVector: { $exists: true }
      }).limit(3).toArray();
      
      console.log('\nÉchantillon de documents:');
      sample.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.title || doc._id}`);
        console.log(`     Modèle: ${doc.embeddingModel || 'Non spécifié'}`);
        console.log(`     Dimensions: ${doc.contentVector?.length || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await client.close();
  }
}

// Exécution du script
const command = process.argv[2];

if (command === 'check') {
  checkEmbeddings();
} else {
  migrateEmbeddings();
} 