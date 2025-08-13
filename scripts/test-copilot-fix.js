import { searchSimilarContent } from '../lib/search.js';

async function testCopilotFix() {
  console.log("🧪 Test du copilot après corrections...\n");
  
  const testQueries = [
    "IT incident resolution process",
    "How to resolve IT incidents",
    "Incident management steps",
    "Troubleshooting IT problems",
    "Emergency IT procedures"
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Test: "${query}"`);
    try {
      const results = await searchSimilarContent(query, "test-org", "test@example.com", "admin", 3);
      console.log(`✅ Résultats: ${results.length}`);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.title} (Score: ${result.relevanceScore?.toFixed(3) || 'N/A'})`);
        });
      } else {
        console.log("  ❌ Aucun résultat trouvé");
      }
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    }
  }
  
  console.log("\n✅ Test terminé");
}

testCopilotFix(); 