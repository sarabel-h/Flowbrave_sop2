// Test script for search relevance
const testSearchRelevance = async () => {
  console.log("🧪 Testing search relevance...");
  
  const testQueries = [
    "onboarding process",
    "guide me through onboarding",
    "help with onboarding",
    "onboarding steps"
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          organization: "test-org-id",
          user: "test@example.com",
          role: "viewer",
          history: [],
          useGuidedMode: false,
          useStreaming: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Sources found:", data.sources?.length || 0);
      
      if (data.sources && data.sources.length > 0) {
        data.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. "${source.title}" - Score: ${source.relevanceScore?.toFixed(3) || 'N/A'}`);
        });
      } else {
        console.log("  ❌ No sources found");
      }
      
    } catch (error) {
      console.error("❌ Test failed:", error);
    }
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testSearchRelevance();
}

module.exports = { testSearchRelevance }; 