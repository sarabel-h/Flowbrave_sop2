const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from .env
const uri = process.env.MONGODB_URI;

// Sample organizations
const organizations = [
  "434234554552332",
  "345345345345345",
  "234234234234234",
  "123123123123123",
  "567567567567567",
  "org_2uYFUunx0UiqJhW71KTYSdzlCfJ" // Added the specific organization ID
];

// Sample SOP data
const sampleSOPs = [
  {
    title: "Customer Onboarding Process",
    content: "# Customer Onboarding Process\n\nThis SOP outlines the standard process for onboarding new customers to ensure a consistent and high-quality experience.",
    assignedTo: [
      { role: "owner", email: "john.doe@example.com" },
      { role: "implementor", email: "jane.smith@example.com" }
    ],
    createdAt: new Date(),
    editedAt: new Date(),
    reference: "SOP-SALES-001",
    tags: ["sales", "onboarding", "customer"],
    organization: organizations[0]
  },
  {
    title: "Product Return Procedure",
    content: "# Product Return Procedure\n\nThis SOP establishes the standard process for handling product returns to ensure consistent customer service and proper inventory management.",
    assignedTo: [
      { role: "owner", email: "robert.johnson@example.com" },
      { role: "implementor", email: "sarah.parker@example.com" }
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    editedAt: new Date(),
    reference: "SOP-SUPPORT-001",
    tags: ["support", "returns", "customer service"],
    organization: organizations[1]
  },
  {
    title: "Employee Expense Reimbursement",
    content: "# Employee Expense Reimbursement\n\nThis document outlines the process for submitting and approving employee expenses.",
    assignedTo: [
      { role: "owner", email: "emily.davis@example.com" },
      { role: "implementor", email: "michael.wilson@example.com" }
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    editedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    reference: "SOP-HR-001",
    tags: ["hr", "finance", "expenses"],
    organization: organizations[2]
  },
  {
    title: "Data Backup Protocol",
    content: "# Data Backup Protocol\n\nThis protocol ensures all company data is properly backed up and can be recovered if needed.",
    assignedTo: [
      { role: "owner", email: "alex.tech@example.com" },
      { role: "implementor", email: "lisa.network@example.com" }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    editedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    reference: "SOP-IT-001",
    tags: ["it", "data", "security"],
    organization: organizations[3]
  },
  {
    title: "New Hire Orientation",
    content: "# New Hire Orientation\n\nThis SOP details the process for welcoming and orienting new employees to the company.",
    assignedTo: [
      { role: "owner", email: "emily.davis@example.com" },
      { role: "implementor", email: "john.doe@example.com" }
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    editedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    reference: "SOP-HR-002",
    tags: ["hr", "onboarding", "training"],
    organization: organizations[4]
  },
  // Adding the new SOPs to the array
  {
    title: "Project Management Workflow",
    content: "# Project Management Workflow\n\nThis SOP outlines the standard process for managing projects within the organization.",
    assignedTo: [
      { role: "owner", email: "project.manager@example.com" },
      { role: "implementor", email: "team.lead@example.com" }
    ],
    createdAt: new Date(),
    editedAt: new Date(),
    reference: "SOP-PM-001",
    tags: ["project", "management", "workflow"],
    organization: organizations[5]
  },
  {
    title: "Client Communication Guidelines",
    content: "# Client Communication Guidelines\n\nThis document establishes the standard process for communicating with clients.",
    assignedTo: [
      { role: "owner", email: "account.manager@example.com" },
      { role: "implementor", email: "client.success@example.com" }
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    editedAt: new Date(),
    reference: "SOP-CLIENT-001",
    tags: ["client", "communication", "guidelines"],
    organization: organizations[5]
  },
  {
    title: "Software Deployment Process",
    content: "# Software Deployment Process\n\nThis SOP details the steps for safely deploying software to production environments.",
    assignedTo: [
      { role: "owner", email: "devops.lead@example.com" },
      { role: "implementor", email: "developer@example.com" }
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    editedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    reference: "SOP-DEV-001",
    tags: ["development", "deployment", "software"],
    organization: organizations[5]
  },
  {
    title: "Quality Assurance Protocol",
    content: "# Quality Assurance Protocol\n\nThis protocol ensures all deliverables meet the organization's quality standards.",
    assignedTo: [
      { role: "owner", email: "qa.manager@example.com" },
      { role: "implementor", email: "tester@example.com" }
    ],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    editedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    reference: "SOP-QA-001",
    tags: ["qa", "quality", "testing"],
    organization: organizations[5]
  },
  {
    title: "Remote Work Policy",
    content: "# Remote Work Policy\n\nThis document outlines the guidelines for employees working remotely.",
    assignedTo: [
      { role: "owner", email: "hr.director@example.com" },
      { role: "implementor", email: "operations.manager@example.com" }
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    editedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    reference: "SOP-HR-003",
    tags: ["hr", "remote", "policy"],
    organization: organizations[5]
  }
];

async function seedDatabase() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get reference to the database
    const database = client.db('Opus');
    
    // Get reference to the collection
    const sopsCollection = database.collection('sop');
    
    // Check if collection already has data
    const count = await sopsCollection.countDocuments();
    if (count > 0) {
      console.log(`Collection already has ${count} documents. Clearing collection...`);
      await sopsCollection.deleteMany({});
    }
    
    // Insert the sample SOPs
    const result = await sopsCollection.insertMany(sampleSOPs);
    
    console.log(`${result.insertedCount} SOPs were successfully added to the database`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedDatabase().catch(console.error);