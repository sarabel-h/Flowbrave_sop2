import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function DELETE(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { organization, tagIndex } = body;

    // Validate required fields
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (tagIndex === undefined || tagIndex < 0) {
      return NextResponse.json(
        { message: 'Valid tag index is required' },
        { status: 400 }
      );
    }

    // Get the tag collection
    const { client, collection: tags } = await getCollection('tag');

    // Check if the organization has tags
    const existingTags = await tags.findOne({ organization });

    if (!existingTags || !existingTags.tags || existingTags.tags.length <= tagIndex) {
      await client.close();
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    // Get the tag that will be deleted (for the response)
    const deletedTag = existingTags.tags[tagIndex];

    // Create a new array without the tag at the specified index
    const updatedTags = [
      ...existingTags.tags.slice(0, tagIndex),
      ...existingTags.tags.slice(tagIndex + 1)
    ];

    // Update the document with the new tags array
    await tags.updateOne(
      { organization },
      { $set: { tags: updatedTags } }
    );

    // Close the connection
    await client.close();

    // Return success response with the updated tags array
    return NextResponse.json({
      message: 'Tag deleted successfully',
      deletedTag,
      updatedTags
    });

  } catch (error) {
    console.error('Error deleting tag:', error);
    
    return NextResponse.json(
      { message: 'Error deleting tag', error: error.message },
      { status: 500 }
    );
  }
}