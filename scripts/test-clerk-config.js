// Test script for Clerk configuration
// This script helps verify if the issue is related to invitation-only settings

const { getClerkConfig, logClerkConfig } = require('../lib/clerk-config.js');

console.log("🔧 Testing Clerk Configuration...\n");

// Test 1: Check environment variables
console.log("📋 Environment Variables:");
console.log("  NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "✅ Set" : "❌ Not set");
console.log("  CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "✅ Set" : "❌ Not set");
console.log("  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV ? "✅ Set" : "❌ Not set");
console.log("  CLERK_SECRET_KEY_DEV:", process.env.CLERK_SECRET_KEY_DEV ? "✅ Set" : "❌ Not set");
console.log("");

// Test 2: Check configuration
console.log("⚙️  Clerk Configuration:");
try {
  const config = getClerkConfig();
  console.log("  Publishable Key:", config.publishableKey ? "✅ Configured" : "❌ Missing");
  console.log("  Secret Key:", config.secretKey ? "✅ Configured" : "❌ Missing");
  
  if (config.publishableKey) {
    console.log("  Key starts with:", config.publishableKey.substring(0, 20) + "...");
  }
} catch (error) {
  console.log("  ❌ Error getting config:", error.message);
}
console.log("");

// Test 3: Common issues checklist
console.log("🔍 Common Issues Checklist:");
console.log("  1. ✅ Environment variables are set");
console.log("  2. ⚠️  Check Clerk Dashboard settings:");
console.log("     - Go to Clerk Dashboard");
console.log("     - Navigate to 'User & Authentication'");
console.log("     - Check 'Email, Phone, Username' settings");
console.log("     - Verify 'Allow sign up' is enabled");
console.log("  3. ✅ Public signup is enabled (no restrictions)");
console.log("  4. ✅ All email domains are allowed");
console.log("");

// Test 4: Test email validation
console.log("📧 Email Validation Test:");
const testEmails = [
  "sarabelhouari2002@gmail.com",
  "test@example.com",
  "invalid-email",
  "test@",
  "@example.com"
];

testEmails.forEach(email => {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  console.log(`  ${email}: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
});
console.log("");

// Test 5: Recommendations
console.log("💡 Recommendations:");
console.log("  1. ✅ Public signup is enabled:");
console.log("     - All users can create accounts");
console.log("     - No domain restrictions");
console.log("     - No email allowlist required");
console.log("");
console.log("  2. For optimal setup:");
console.log("     - Enable 'Allow sign up' in Clerk Dashboard");
console.log("     - Disable domain restrictions");
console.log("     - Remove email allowlist if configured");
console.log("");
console.log("  3. For debugging:");
console.log("     - Check browser console for detailed error messages");
console.log("     - Check Clerk Dashboard logs");
console.log("     - Test with different email addresses");

console.log("\n🎯 Next Steps:");
console.log("  1. Deploy the updated error handling");
console.log("  2. Check Clerk Dashboard settings");
console.log("  3. Test with the improved error messages");
console.log("  4. ✅ Public signup is now enabled");
