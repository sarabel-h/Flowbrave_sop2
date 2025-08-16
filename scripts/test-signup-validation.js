// Test script for signup form validation
// This script can be run to test the validation improvements

const testCases = [
  {
    name: "Empty form",
    data: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      organization: "",
      companySize: "",
      role: "",
      acceptTerms: false
    },
    expectedError: "First name is required"
  },
  {
    name: "Invalid email",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123",
      organization: "Test Company",
      companySize: "1",
      role: "founder/ceo",
      acceptTerms: true
    },
    expectedError: "Please enter a valid email address"
  },
  {
    name: "Weak password",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "123",
      confirmPassword: "123",
      organization: "Test Company",
      companySize: "1",
      role: "founder/ceo",
      acceptTerms: true
    },
    expectedError: "Password must be at least 8 characters"
  },
  {
    name: "Password without letters",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "12345678",
      confirmPassword: "12345678",
      organization: "Test Company",
      companySize: "1",
      role: "founder/ceo",
      acceptTerms: true
    },
    expectedError: "Password must contain at least one letter"
  },
  {
    name: "Password without numbers",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "password",
      confirmPassword: "password",
      organization: "Test Company",
      companySize: "1",
      role: "founder/ceo",
      acceptTerms: true
    },
    expectedError: "Password must contain at least one number"
  },
  {
    name: "Passwords don't match",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password456",
      organization: "Test Company",
      companySize: "1",
      role: "founder/ceo",
      acceptTerms: true
    },
    expectedError: "Passwords do not match"
  },
  {
    name: "No company size selected",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      organization: "Test Company",
      companySize: "",
      role: "founder/ceo",
      acceptTerms: true
    },
    expectedError: "Please select a company size"
  },
  {
    name: "No role selected",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      organization: "Test Company",
      companySize: "1",
      role: "",
      acceptTerms: true
    },
    expectedError: "Please select your role"
  },
  {
    name: "Terms not accepted",
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      organization: "Test Company",
      companySize: "1",
      role: "founder/ceo",
      acceptTerms: false
    },
    expectedError: "You must accept the terms and conditions"
  }
]

// Mock validation function (simplified version of what's in the form)
function validateFormData(data) {
  const validationErrors = []

  if (!data.firstName?.trim()) {
    validationErrors.push("First name is required")
  }

  if (!data.lastName?.trim()) {
    validationErrors.push("Last name is required")
  }

  if (!data.email?.trim()) {
    validationErrors.push("Email is required")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    validationErrors.push("Please enter a valid email address")
  }

  if (!data.organization?.trim()) {
    validationErrors.push("Company name is required")
  }

  if (!data.companySize) {
    validationErrors.push("Please select a company size")
  }

  if (!data.role) {
    validationErrors.push("Please select your role")
  }

  if (!data.password) {
    validationErrors.push("Password is required")
  } else if (data.password.length < 8) {
    validationErrors.push("Password must be at least 8 characters")
  } else if (!/[a-zA-Z]/.test(data.password)) {
    validationErrors.push("Password must contain at least one letter")
  } else if (!/\d/.test(data.password)) {
    validationErrors.push("Password must contain at least one number")
  }

  if (!data.confirmPassword) {
    validationErrors.push("Please confirm your password")
  } else if (data.password !== data.confirmPassword) {
    validationErrors.push("Passwords do not match")
  }

  if (!data.acceptTerms) {
    validationErrors.push("You must accept the terms and conditions")
  }

  return validationErrors
}

// Run tests
console.log("🧪 Testing signup form validation...\n")

let passedTests = 0
let totalTests = testCases.length

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`)
  
  const errors = validateFormData(testCase.data)
  const firstError = errors[0] || "No validation error"
  
  if (firstError === testCase.expectedError) {
    console.log(`✅ PASSED: Expected "${testCase.expectedError}", got "${firstError}"`)
    passedTests++
  } else {
    console.log(`❌ FAILED: Expected "${testCase.expectedError}", got "${firstError}"`)
  }
  
  console.log("")
})

console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`)

if (passedTests === totalTests) {
  console.log("🎉 All validation tests passed!")
} else {
  console.log("⚠️  Some validation tests failed. Please review the implementation.")
}
