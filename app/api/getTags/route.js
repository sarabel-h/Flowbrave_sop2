import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function GET(request) {
  console.log("GET request received for tags")
  // Get the company ID from the URL search params
  const searchParams = request.nextUrl.searchParams;
  const organization = searchParams.get('organization');

  try {
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get the tag collection
    const { client, collection: tags } = await getCollection('tag');

    // Get all tags
    const allTags = await tags.find({ organization }).toArray();

    // Close the connection
    await client.close();
    
    // Return the tags
    return NextResponse.json({
      tags: allTags[0]?.tags || []
    });
    
  } catch (error) {
    console.error('Error fetching tags:', error);
    
    return NextResponse.json(
      { message: 'Error fetching tags', error: error.message },
      { status: 500 }
    );
  }
}