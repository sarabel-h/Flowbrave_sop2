import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { generateEmbedding } from '@/lib/search';

export async function POST(request) {
  
  try {
    
    // Get request body
    const body = await request.json();
    const { title, content = null, tags, organization, assignedTo, version = 1.0, id } = body;

    // Validate required fields
    if (!title || !organization) {
      return NextResponse.json(
        { error: 'Title and organization are required fields' },
        { status: 400 }
      );
    }

    // Connect to the database and get the SOP collection
    const { client, collection } = await getCollection('sop');
    
    // Generate embedding for the content
    const contentVector = content == null ? null : await generateEmbedding(content);
    
    // Create new SOP document
    const newSop = {
      title,
      content,
      contentVector,
      tags: tags || [],
      organization,
      version,
      _id: id,
      assignedTo: assignedTo || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the new SOP
    const result = await collection.insertOne(newSop);

    // Format the response
    const formattedSop = {
      id: result.insertedId.toString(),
      title: newSop.title,
      content: newSop.content,
      tags: newSop.tags,
      createdAt: new Date(newSop.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      assignedTo: newSop.assignedTo
    };

    // Close the connection
    await client.close();
    
    return NextResponse.json({
      status: 200,
      data: formattedSop
    });

  } catch (error) {

    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'ID already exists', code: 409 },
        { status: 409 }
      );
    }

    console.error('Error creating SOP:', error);
    
    return NextResponse.json(
      { error: "Error creating SOP" },
      { status: 500 }
    );
  }
}