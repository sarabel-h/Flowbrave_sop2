import { searchSimilarContent } from '../lib/search.js';

async function quickTest() {
  console.log("⚡ Test rapide de la recherche...\n");
  
  const testQuery = "IT incident resolution";
  
  try {
    console.log(`🔍 Recherche: "${testQuery}"`);
    const results = await searchSimilarContent(testQuery, "test-org", "test@example.com", "admin", 5);
    
    console.log(`\n📊 Résultats trouvés: ${results.length}`);
    
    if (results.length > 0) {
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title}`);
        console.log(`     Score: ${result.relevanceScore?.toFixed(3) || 'N/A'}`);
        console.log(`     Types: ${result.searchTypes?.join(', ') || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log("❌ Aucun résultat trouvé");
    }
    
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
  
  console.log("✅ Test terminé");
}

quickTest(); 