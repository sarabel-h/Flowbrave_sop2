import { MongoClient } from 'mongodb';

// MongoDB connection handler
export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  
  const database = client.db('Opus');
  
  return { client, database };
}

// Get a specific collection
export async function getCollection(collectionName) {
  const { client, database } = await connectToDatabase();
  const collection = database.collection(collectionName);
  
  return { client, collection };
}