#!/usr/bin/env node

/**
 * Script de configuration des index vectoriels et textuels pour MongoDB Atlas
 * 
 * Ce script configure les index nécessaires pour optimiser la recherche vectorielle
 * et textuelle dans votre application SOP.
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'Opus';
const COLLECTION_NAME = 'sop';

async function setupIndexes() {
  console.log('🚀 Configuration des index MongoDB Atlas...');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI non définie dans les variables d\'environnement');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion à MongoDB établie');
    
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // 1. Index vectoriel pour les embeddings
    console.log('📊 Configuration de l\'index vectoriel...');
    try {
      await database.command({
        createSearchIndex: COLLECTION_NAME,
        name: "sop_vector_index",
        definition: {
          mappings: {
            dynamic: true,
            fields: {
              contentVector: {
                dimensions: 1536,
                similarity: "cosine",
                type: "knnVector"
              }
            }
          }
        }
      });
      console.log('Index vectoriel créé avec succès');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Index vectoriel existe déjà');
      } else {
        console.error('Erreur lors de la création de l\'index vectoriel:', error.message);
      }
    }
    
    // 2. Index textuel pour la recherche textuelle
    console.log('Configuration de l\'index textuel...');
    try {
      await database.command({
        createSearchIndex: COLLECTION_NAME,
        name: "sop_text_index",
        definition: {
          mappings: {
            dynamic: true,
            fields: {
              title: {
                type: "autocomplete",
                tokenization: "standard",
                foldDiacritics: false,
                maxGrams: 7,
                minGrams: 3
              },
              content: {
                type: "text",
                analyzer: "lucene.standard"
              },
              tags: {
                type: "text",
                analyzer: "lucene.standard"
              }
            }
          }
        }
      });
      console.log('Index textuel créé avec succès');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Index textuel existe déjà');
      } else {
        console.error('Erreur lors de la création de l\'index textuel:', error.message);
      }
    }
    
    // 3. Index composé pour optimiser les requêtes
    console.log('Configuration des index composés...');
    try {
      await collection.createIndex(
        { 
          organization: 1, 
          isChunk: 1, 
          createdAt: -1 
        },
        { name: "org_chunk_date_index" }
      );
      console.log('Index composé organisation/chunk/date créé');
    } catch (error) {
      console.log('Index composé existe déjà ou erreur:', error.message);
    }
    
    // 4. Index pour les tags
    try {
      await collection.createIndex(
        { tags: 1 },
        { name: "tags_index" }
      );
      console.log('Index tags créé');
    } catch (error) {
      console.log('Index tags existe déjà ou erreur:', error.message);
    }
    
    // 5. Index pour les permissions utilisateur
    try {
      await collection.createIndex(
        { 
          organization: 1, 
          "assignedTo.email": 1 
        },
        { name: "org_user_permissions_index" }
      );
      console.log('Index permissions utilisateur créé');
    } catch (error) {
      console.log('Index permissions existe déjà ou erreur:', error.message);
    }
    
    // 6. Vérification des index existants
    console.log('\nIndex existants dans la collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🎉 Configuration des index terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('  1. Attendez que les index soient complètement créés (peut prendre quelques minutes)');
    console.log('  2. Testez la recherche vectorielle avec votre application');
    console.log('  3. Surveillez les performances dans MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des index:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Fonction pour vérifier l'état des index
async function checkIndexStatus() {
  console.log('🔍 Vérification de l\'état des index...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // Vérifier les index de recherche
    const searchIndexes = await database.command({
      listSearchIndexes: COLLECTION_NAME
    });
    
    console.log('\n📊 Index de recherche:');
    searchIndexes.cursor.firstBatch.forEach(index => {
      console.log(`  - ${index.name}: ${index.status}`);
    });
    
    // Vérifier les index normaux
    const indexes = await collection.indexes();
    console.log('\n🔗 Index normaux:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await client.close();
  }
}

// Exécution du script
const command = process.argv[2];

if (command === 'check') {
  checkIndexStatus();
} else {
  setupIndexes();
} 