// Test script for guided mode
const testGuidedMode = async () => {
  console.log("🧪 Testing guided mode...");
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "Guide me through the onboarding process",
        organization: "test-org-id",
        user: "test@example.com",
        role: "viewer",
        history: [],
        useGuidedMode: true,
        useStreaming: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Response received:");
    console.log("Guided mode:", data.guidedMode);
    console.log("Progress:", data.progress);
    console.log("Current step:", data.currentStep);
    console.log("Process title:", data.processTitle);
    console.log("Response:", data.response.substring(0, 200) + "...");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testGuidedMode();
}

module.exports = { testGuidedMode }; 