import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function DELETE(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { organization, email, userId, leadEmail } = body;

    // Validate required fields
    if (!organization || !email) {
      return NextResponse.json(
        { message: 'Organization ID and email are required' },
        { status: 400 }
      );
    }

    // Get the SOP collection
    const { client, collection: sop } = await getCollection('sop');

    // Update all SOPs to remove the member from assignedTo arrays
    const result = await sop.updateMany(
      { organization, 'assignedTo.email': email, 'assignedTo.role': "owner" },
      { $set: { 'assignedTo.$.email': leadEmail } }
    );

    const deleteResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`, "Content-Type": "application/json" }
    });

    const deleted = await deleteResponse.json();
    console.log("User deleted", deleted);
    
    if(!deleteResponse.ok) {
      return NextResponse.json(
        { message: 'Error removing member', error: deleted.message },
        { status: 500 }
      );
    }

    // Close the connection
    await client.close();

    // Return success response
    return NextResponse.json({
      message: 'Member removed successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error removing member:', error);
    
    return NextResponse.json(
      { message: 'Error removing member', error: error.message },
      { status: 500 }
    );
  }
}