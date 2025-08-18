import { NextResponse } from 'next/server';
import { clerkClient, getAuth } from "@clerk/nextjs/server";

export async function POST(request) {

  try {
    
    // Get request body
    const body = await request.json();
    const { name, role, companySize } = body;

    // Validate request body
    if (!name || !role || !companySize) {

      return NextResponse.json(
        { error: 'Name, role, and company size are required fields.' },
        { status: 400 }
      );

    }

    // Get authentication status
    var { userId } = getAuth(request);
    const actorId = userId || body.createdUserId;
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new organization
    var response = await (await clerkClient()).organizations.createOrganization({ 
      name, 
      createdBy: actorId
    })

    // Set the user's role and company size
    var metadata = await (await clerkClient()).users.updateUserMetadata(userId, { publicMetadata: { companyRole: role, companySize, companyId: response.id } });

    // Return the created organization
    return NextResponse.json({ success: true, data: metadata });
    
  } catch (error) {

    console.error('Error creating organization:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );

  }
}
