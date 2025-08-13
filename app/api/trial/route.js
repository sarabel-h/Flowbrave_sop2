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

    // Get billing data
    const billing = org.publicMetadata?.billing || {};

    // Todo: Add check with stripe if there is not an existing subscription for this user
    // To prevent abuse

    // Price validation
    const priceId = process.env.STRIPE_PRICE_ID;

    // URL configuration
    const returnUrl = process.env.BILLING_RETURN_URL || "http://localhost:3000";

    const success = `${returnUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`;

    const cancel = `${returnUrl}/?canceled=true`;

    // Free trial configuration
    const period = 30; 

    // Create new checkout session for new customers with trial
    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],
      
      mode: "subscription",

      line_items: [{ price: priceId, quantity: 1 }],
      
      subscription_data: {

        metadata: {

          // We need metadata in subscription as well
          userId: userId,

          organizationId: organization

        },

        trial_period_days: period

      },
      
      metadata: {

        userId: userId,

        organizationId: organization

      },
      
      success_url: success,

      cancel_url: cancel

    });

    return NextResponse.json({ url: session.url });

  } 
  catch (error) {

    console.error("Billing API error:", error);

    return new NextResponse(error.message || "Internal Server Error", { status: 500 });

  }
}
