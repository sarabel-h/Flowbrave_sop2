import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function DELETE(request) {
  try {
    // Get request body
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'SOP ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database and get the SOP collection
    const { client, collection } = await getCollection('sop');
    
    // Delete SOP by ID
    const deletedSop = await collection.findOneAndDelete(
      { _id: id }
    );

    if (!deletedSop) {
      await client.close();
      return NextResponse.json(
        { error: 'SOP not found' },
        { status: 404 }
      );
    }

    console.log("deletedSop: ", deletedSop)

    // Format the deleted SOP data for response
    const formattedSop = {
      id: deletedSop._id.toString(),
      title: deletedSop.title,
      content: deletedSop.content,
      tags: deletedSop.tags || [],
      createdAt: new Date(deletedSop.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      assignedTo: deletedSop.assignedTo || []
    };

    // Close the connection
    await client.close();
    
    return NextResponse.json({
      status: 200,
      data: formattedSop
    });

  } catch (error) {
    console.error('Error deleting SOP:', error);
    return NextResponse.json(
      { error: 'Failed to delete SOP' },
      { status: 500 }
    );
  }
}