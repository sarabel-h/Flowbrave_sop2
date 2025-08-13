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
    const { client, collection: sop } = await getCollection('sop');

    // Get all tags
    // const [ allMembers ] = await sop.aggregate([
    //   { $match: { organization } },
    //   { $unwind: "$assignedTo" },
    //   { $group: {
    //       _id: "$organization",
    //       members: { $addToSet: "$assignedTo.email" }
    //     }
    //   },
    //   { $project: { _id: 0 }
    //   }
    // ]).toArray();

    // Fetch from members collection
    const { collection: members } = await getCollection('member');
    const allMembers = await members.find({ organization }).toArray();

    // Close the connection
    await client.close();
    
    // Return the tags
    return NextResponse.json({
      members: allMembers || []
    });
    
  } catch (error) {
    console.error('Error fetching members:', error);
    
    return NextResponse.json(
      { message: 'Error fetching members', error: error.message },
      { status: 500 }
    );
  }
}