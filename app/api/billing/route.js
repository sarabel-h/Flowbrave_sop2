import { NextResponse } from "next/server";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import Stripe from "stripe";

// Initialize Stripe with error checking
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Init stripe 
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

export async function POST(request) {

  try {

    // Authentication check
    const { userId } = getAuth(request);
    
    // Not authenticated
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Request body validation
    const body = await request.json();

    // Get organization id
    const { organization } = body;
    
    if (!organization) return new NextResponse("Missing required fields", { status: 400 });

    // Get user and organization info
    const clerk = await clerkClient();

    // Get user info
    const user = await clerk.users.getUser(userId);

    if (!user) return new NextResponse("User not found", { status: 404 });

    // Get the organization
    const org = await clerk.organizations.getOrganization({ organizationId: organization });

    // Check if customer ID exists
    if (!org.publicMetadata.billing?.customerId) return new NextResponse("Organization is not on an active plan.", { status: 400 });

    // URL configuration
    const returnUrl = process.env.BILLING_RETURN_URL || "http://localhost:3000";

    const success = `${returnUrl}/`;

    // Create a new session
    const session = await stripe.billingPortal.sessions.create({

        customer: org.publicMetadata.billing.customerId,
        
        return_url: success

    });

    return NextResponse.json({ url: session.url });

  } 
  catch (error) {

    console.error("Billing API error:", error);

    return new NextResponse(error.message || "Internal Server Error", { status: 500 });

  }
}
