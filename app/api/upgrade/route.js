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
    const { organization, upgrade } = body;
    
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

    // Check if billing is on valid trial
    if (!billing) return new NextResponse("You are not on an active plan", { status: 422 });
    
    if (billing.status != "trialing" && !upgrade) return new NextResponse("You are not on an active trial", { status: 422 });

    // Get subscription
    const subscription = await stripe.subscriptions.retrieve(billing.subscriptionId);

    // Update subscription and end trial now
    const update = await stripe.subscriptions.update(billing.subscriptionId, upgrade ? {

      // Upgrade is needed
      items: [{

        id: subscription.items.data[0].id,

        quantity: subscription.items.data[0].quantity + upgrade

      }],

      proration_behavior: "create_prorations"

    } : {

      trial_end: "now",

      proration_behavior: "create_prorations"

    })

    return NextResponse.json({ success: true });

  } 
  catch (error) {

    console.error("Billing API error:", error);

    return new NextResponse(error.message || "Internal Server Error", { status: 500 });

  }
}
