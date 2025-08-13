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

    // Check if billing is on valid trial
    if (!billing) return new NextResponse("You are not on an active plan", { status: 422 });

    // Get subscription
    const subscription = await stripe.subscriptions.retrieve(billing.subscriptionId);

    // Get preview 
    const preview = await stripe.invoices.createPreview({

      subscription: billing.subscriptionId,

      subscription_details: {

        items: [{

          id: subscription.items.data[0].id,

          quantity: subscription.items.data[0].quantity + 1

        }],

        proration_behavior: "create_prorations"

      }

    })

    return NextResponse.json({ success: true, breakdown: formatInvoiceBreakdown(preview.lines.data) });

  } 
  catch (error) {

    console.error("Billing API error:", error);

    return new NextResponse(error.message || "Internal Server Error", { status: 500 });

  }
}


// A refernece function to return preview
function formatInvoiceBreakdown(lineItems) {

  // Group line items by period.start (cycle)
  const cycles = {};

  lineItems.forEach(item => {
  
    const end = item.period.end * 1000;
    
    // All changes within a cycle should be grouped together
    if (!cycles[end]) {
  
      cycles[end] = {
        
        end,

        items: []
      
      };
  
    }
  
    cycles[end].items.push(item);
  
  });

  // Sort cycles by end date
  const sortedCycles = Object.values(cycles).sort((a, b) => a.end - b.end);

  // Return
  return sortedCycles;
}