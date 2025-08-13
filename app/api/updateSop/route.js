import { NextResponse } from 'next/server';
import { saveDocumentWithVector } from '@/lib/search';

export async function PUT(request) {
  
  try {

    // Get request body
    const body = await request.json();
    const { id, organization, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'SOP ID is required' },
        { status: 400 }
      );
    }

    // Save document with vector embedding
    const updatedSop = await saveDocumentWithVector({
      id,
      organization,
      ...updateData
    });

    // Format the SOP data for response
    const formattedSop = {
      id: id,
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