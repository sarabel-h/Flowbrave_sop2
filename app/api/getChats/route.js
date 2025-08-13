import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function GET(request) {
  console.log("GET request received for tags")
  // Get the company ID from the URL search params
  const searchParams = request.nextUrl.searchParams;
  const organization = searchParams.get('organization');
  const user = searchParams.get('user');

  try {
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization ID is required' },
        { status: 400 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the tag collection
    const { client, collection: chats } = await getCollection('chat');

    // Get all tags
    const allChats = await chats.find({ organization, user }).toArray();

    // Close the connection
    await client.close();
    
    // Return the tags
    return NextResponse.json({
      chats: allChats || []
    });
    
  } catch (error) {
    console.error('Error fetching chats:', error);
    
    return NextResponse.json(
      { message: 'Error fetching chats', error: error.message },
      { status: 500 }
    );
  }
}