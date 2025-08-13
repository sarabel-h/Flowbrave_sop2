import { getCollection } from '../lib/db.js';
import { searchSimilarContent, generateEmbedding } from '../lib/search.js';

async function debugSearch() {
  try {
    console.log("Début du diagnostic de recherche...");
    
    // 1. Vérifier la connexion à la base de données
    const { client, collection } = await getCollection('sop');
    console.log("Connexion à la base de données établie");
    
    // 2. Compter le nombre total de SOPs
    const totalSOPs = await collection.countDocuments();
    console.log(`Nombre total de SOPs dans la base: ${totalSOPs}`);
    
    if (totalSOPs === 0) {
      console.log("Aucune SOP trouvée dans la base de données!");
      await client.close();
      return;
    }
    
    // 3. Lister quelques SOPs pour vérification
    const sampleSOPs = await collection.find({}).limit(3).toArray();
    console.log("Exemples de SOPs:");
    sampleSOPs.forEach((sop, index) => {
      console.log(`  ${index + 1}. ${sop.title} (${sop.organization})`);
    });
    
    // 4. Vérifier les embeddings
    const sopsWithEmbeddings = await collection.countDocuments({ contentVector: { $exists: true } });
    console.log(`SOPs avec embeddings: ${sopsWithEmbeddings}/${totalSOPs}`);
    
    // 5. Tester la recherche avec une requête simple
    const testQuery = "IT incident resolution";
    console.log(`\nTest de recherche avec: "${testQuery}"`);
    
    try {
      const results = await searchSimilarContent(testQuery, "test-org", "test@example.com", "admin", 5);
      console.log(`Résultats trouvés: ${results.length}`);
      
      if (results.length > 0) {
        console.log("Détails des résultats:");
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.title} (Score: ${result.relevanceScore.toFixed(3)})`);
        });
      } else {
        console.log("Aucun résultat trouvé");
      }
    } catch (searchError) {
      console.error("Erreur lors de la recherche:", searchError);
    }
    
    // 6. Test de recherche textuelle directe
    console.log(`\nTest de recherche textuelle directe...`);
    const textResults = await collection.find({
      $or: [
        { title: { $regex: "incident", $options: 'i' } },
        { content: { $regex: "incident", $options: 'i' } },
        { tags: { $in: ["incident", "IT"] } }
      ]
    }).limit(3).toArray();
    
    console.log(`Résultats de recherche textuelle: ${textResults.length}`);
    textResults.forEach((sop, index) => {
      console.log(`  ${index + 1}. ${sop.title}`);
    });
    
    await client.close();
    
  } catch (error) {
    console.error("Erreur lors du diagnostic:", error);
  }
}

// Fonction pour tester la génération d'embeddings
async function testEmbedding() {
  try {
    console.log("\nTest de génération d'embeddings...");
    const testText = "IT incident resolution process";
    const embedding = await generateEmbedding(testText);
    console.log(`Embedding généré avec succès (longueur: ${embedding.length})`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la génération d'embedding:", error);
    return false;
  }
}

// Exécuter les tests
async function runDiagnostics() {
  console.log("Démarrage des diagnostics de recherche...\n");
  
  const embeddingWorks = await testEmbedding();
  if (embeddingWorks) {
    await debugSearch();
  }
  
  console.log("\nDiagnostics terminés");
}

runDiagnostics(); 