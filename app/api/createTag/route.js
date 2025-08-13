import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function POST(request) {
  
  try {

    // Get the request body
    const body = await request.json();
    const { organization, tagName } = body;

    // Validate required fields
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!tagName) {
      return NextResponse.json(
        { message: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Get the tag collection
    const { client, collection: tags } = await getCollection('tag');

    // Check if the organization already has tags
    const existingTags = await tags.findOne({ organization });

    if (existingTags) {

      // Check if tag already exists
      if (existingTags.tags.includes(tagName)) {
        
        await client.close();
        return NextResponse.json(
          { message: 'Tag already exists' },
          { status: 400 }
        );
      }

      // Add the new tag to the existing tags
      await tags.updateOne(
        { organization },
        { $push: { tags: tagName } }
      );
    } else {
      // Create a new document for the organization with the tag
      await tags.insertOne({
        organization,
        tags: [tagName]
      });
    }

    // Close the connection
    await client.close();

    // Return success response
    return NextResponse.json({
      message: 'Tag created successfully',
      tagName
    });

  } catch (error) {
    console.error('Error creating tag:', error);
    
    return NextResponse.json(
      { message: 'Error creating tag', error: error.message },
      { status: 500 }
    );
  }
}