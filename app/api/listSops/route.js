import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function GET(request) {

  console.log("GET request received for list SOPs")

  // Get the company ID from the URL search params
  const searchParams = request.nextUrl.searchParams
  const organization = searchParams.get('organization');
  const accessLevel = searchParams.get('accessLevel');
  const email = searchParams.get('email');

  try {

    if (!organization) {

      return NextResponse.json(
        { message: 'Organization ID is required' },
        { status: 400 }
      );

    }

    // Connect to the database and get the SOP collection
    const { client, collection: sops } = await getCollection('sop');

    if(accessLevel === 'organization') {
      // Get SOPs filtered by organization/company ID
      var allSops = await sops.find(
        
        { organization }).toArray();
    }
    if(accessLevel === 'user') {
      // Get SOPs filtered by organization/company ID
      var allSops = await sops.find(

        { organization, assignedTo: { $elemMatch: { email } } } ).toArray();
    }
  
    // Format the data to match the expected structure in the Files component
    const formattedSops = allSops.map(sop => ({

      id: sop._id.toString(),
      title: sop.title,
      assignedTo: sop.assignedTo && sop.assignedTo.length > 0 
        ? sop.assignedTo[0].email.split('@')[0] 
        : null,
      createdAt: new Date(sop.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      updatedAt: new Date(sop.updatedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      tags: sop.tags || [],
      version: sop.version || '1.0.0',
    }));
    
    // Close the connection
    await client.close();
    
    // Return the SOPs
    return NextResponse.json(formattedSops);
    
  } catch (error) {
    console.error('Error fetching SOPs:', error);
    
    return NextResponse.json(
      { message: 'Error fetching SOPs', error: error.message },
      { status: 500 }
    );
  }
}