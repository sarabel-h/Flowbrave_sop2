import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request) {

  try {
  
    // Get the request body
    const body = await request.json();
  
    const { organization, email, leadEmail } = body;

    // Validate required fields
    if (!organization)
  
      return NextResponse.json({ message: "Organization ID is required" }, { status: 400 });

    if (!email) 
      
      return NextResponse.json({ message: "Email is required" },{ status: 400 });
    

    if (!leadEmail) 
      
      return NextResponse.json({ message: "Lead email is required" },{ status: 400 });


    const headersList = await headers();

    // Sending invitation to user
    const res = await fetch(`https://api.clerk.com/v1/organizations/${organization}/invitations`, {

      method: "POST",
      
      headers: {
      
        "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json"
      
      },
      
      body: JSON.stringify({
      
        email_address: email,
        role: "org:member",
        redirect_url: `${headersList.get("origin")}/auth/register?organization=${organization}`
      
      })

    });

    if(!res.ok) {

      const { errors } = await res.json();
      
      return NextResponse.json({ message: errors[0].message },{ status: 500 });

    }

    // Return success response
    return NextResponse.json({message: "Member added successfully", email });

  } 
  catch (error) {
  
    console.error("Error adding member:", error);
    
    return NextResponse.json({ message: "Error adding member", error: error.message },{ status: 500 });
    
  }
}