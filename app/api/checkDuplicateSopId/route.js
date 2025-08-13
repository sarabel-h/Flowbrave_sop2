import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { generateEmbedding } from '@/lib/search';

export async function GET(request) {
  
  try {
    // Get the company ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const organization = searchParams.get('organization');
    const id = searchParams.get('id');

    // Validate required fields
    if (!id && !organization) {
      return NextResponse.json(
        { error: 'id and organization are required field' },
        { status: 400 }
      );
    }

    // Connect to the database and get the SOP collection
    const { client, collection } = await getCollection('sop');

    // Insert the new SOP
    const sop = await collection.findOne({ organization, _id: id });

    if(sop) return NextResponse.json(
      { message: 'ID already exists', code: 409 },
      { status: 409 }
    );

    // Close the connection
    await client.close();
    
    return NextResponse.json({
      status: 200,
      data: id
    });

  } catch (error) {
    console.log(error);
    NextResponse.json({
      message: "server error",
      code: 500
    }, { status: 500 });
  }
}