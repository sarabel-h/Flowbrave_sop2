import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';


export async function GET(request) {

  const searchParams = request.nextUrl.searchParams;
  const sopId = searchParams.get('sopId');

  try {
    if (!sopId) {
      return NextResponse.json(
        { error: 'SOP ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database and get the SOP collection
    const { client, collection } = await getCollection('sop');
    
    // Get specific SOP by ID and organization
    const sop = await collection.findOne({
      _id: sopId
    });

    if (!sop) {
      await client.close();
      return NextResponse.json(
        { error: 'SOP not found' },
        { status: 404 }
      );
    }

    // Format the SOP data
    const formattedSop = {
      id: sop._id.toString(),
      title: sop.title,
      content: sop.content,
      organization: sop.organization,
      tags: sop.tags || [],
      updatedAt: new Date(sop.updatedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      createdAt: new Date(sop.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      assignedTo: sop.assignedTo || []
    };

    // Close the connection
    await client.close();
    
    return NextResponse.json(formattedSop);

  } catch (error) {
    console.error('Error fetching SOP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOP' },
      { status: 500 }
    );
  }
}