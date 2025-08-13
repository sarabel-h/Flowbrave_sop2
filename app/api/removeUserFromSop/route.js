import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function PUT(request) {

  try {

    // Get request body
    const body = await request.json();
    const { id, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'SOP ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database and get the SOP collection
    const { client, collection } = await getCollection('sop');
    
    // Update SOP by ID
    const updatedSop = await collection.findOneAndUpdate(
      { _id: id },
      [
        { $set: {
          assignedTo: {
            $filter: {
              input: "$assignedTo",
              as: "user",
              cond: {
                $ne: ["$$user.email", email]
              }
            }
          }
        } },
      ],
      { upsert: true, returnDocument: 'after' }
    );

    console.log("updatedSop: ", updatedSop)

    // Format the SOP data
    const formattedSop = {
      id: updatedSop._id.toString(),
      title: updatedSop.title,
      content: updatedSop.content,
      tags: updatedSop.tags || [],
      createdAt: new Date(updatedSop.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      assignedTo: updatedSop.assignedTo || []
    };

    // Close the connection
    await client.close();
    
    return NextResponse.json({
        status: 200,
        data: formattedSop
    });

  } catch (error) {
    console.error('Error updating SOP:', error);
    return NextResponse.json(
      { error: 'Failed to update SOP' },
      { status: 500 }
    );
  }
}