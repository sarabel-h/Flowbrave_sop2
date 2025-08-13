import { NextResponse } from 'next/server';
import { clerkClient, getAuth } from "@clerk/nextjs/server";

export async function POST(request) {

  try {
    
    // Get request body
    const body = await request.json();
    const { organization, role } = body;

    // Validate request body
    if (!organization || !role) {

      return NextResponse.json(
        { error: 'Organization ID and role are required fields.' },
        { status: 400 }
      );

    }

    // Get authentication status
    var { userId } = getAuth(request);

    // Set the user's role and company size
    var metadata = await (await clerkClient()).users.updateUserMetadata(userId, { publicMetadata: { companyRole: role, companyId: organization } });

    // Return the created organization
    return NextResponse.json({ success: true, data: metadata });
    
  } catch (error) {

    console.error('Error adding to organization:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );

  }
}
