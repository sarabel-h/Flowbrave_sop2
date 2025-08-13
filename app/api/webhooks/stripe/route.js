import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

// Initialize Stripe with proper error handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Create a new SDK object
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

// Request handler for all stripe webhooks
export async function POST(request) {

  try {

    // Get payload
    const payload = await request.text();

    // And request signature
    const sig = request.headers.get("stripe-signature");

    if (!sig) 

      return NextResponse.json({ error: "Missing Stripe signature header" }, { status: 400 });

    var event;

    // Parse event
    try {

      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      
      console.log(`✅ Received event type: ${event.type}`);

    } 
    catch (err) {
    
      console.error(`❌ Webhook Error: ${err.message}`);
    
      return NextResponse.json({ error: `Webhook Error: ${err.message}` },{ status: 400 });

    }

    // User has subscribed to a plan
    if (event.type === "checkout.session.completed") 

      await checkoutCompleted(event.data.object);

    // User has updated the subscription, downgraded, or upgraded
    else if (event.type === "customer.subscription.updated") 

      await subscriptionUpdated(event.data.object);

    // User has canceled the subscription
    else if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.canceled") 

      await subscriptionCanceled(event.data.object);

    // Todo: Handle use case for recurring payment processing like invoice payment succeeded
    else

      console.log(`Unhandled event type: ${event.type}`);

    return NextResponse.json({ received: true });

  } 
  catch (error) {

    console.error("Webhook processing error:", error);

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });

  }

}

// All handler functions

async function checkoutCompleted(session) {

  if (session.mode !== "subscription") return;

  if (!session.subscription)
    
    throw new Error("No subscription ID found in checkout session");

  // Update the billing for the organization, pass id of the subscription
  await update(session.subscription, true);

}

async function subscriptionUpdated(subscription) {
  
  // Update the billing for the organization
  await update(subscription.id, false);

}

async function subscriptionCanceled(subscription) {
  
  // Get organization id
  const { organizationId } = subscription.metadata;

  if (!organizationId) {

    console.log("No organizationId in subscription metadata");

    return;
  }

  try {

    // Create clerk client
    const clerk = await clerkClient();

    // Get organization details
    const org = await clerk.organizations.getOrganization({ organizationId });

    // Validate
    if (!org)
    
      throw new Error(`Organization with ID ${organizationId} not found`);

    // Update public metadata of organization to reflect cancellation
    await clerk.organizations.updateOrganization(organizationId, {

      publicMetadata: {

        ...org.publicMetadata,
        
        billing: {

          ...(org.publicMetadata?.billing || {}),

          // Reset seats to 0 on cancellation
          seats: 0, 

          status: "canceled",

          updateType: "canceled",

          updatedAt: new Date().toISOString()

        }
      }

    });

    
  } 
  catch (error) {

    console.error("Failed to update canceled subscription:", error);

  }
}

async function update(subscriptionId, isNew) {
  
  // Use stripe to get the subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Get meta data of subscription that we attached at the time of checkout
  const { organizationId, userId } = subscription.metadata;
  
  if (!organizationId) 

    throw new Error("No organizationId in subscription metadata");

  // Access clerk
  const clerk = await clerkClient(); 

  // Get organization details
  const org = await clerk.organizations.getOrganization({ organizationId });

  // Validate
  if (!org)

    throw new Error(`Organization with ID ${organizationId} not found`);

  // Get current billing data
  const billing = org.publicMetadata?.billing || {};

  // Seats
  const currentSeats = billing.seats || 0;
  const updatedSeats = subscription.items.data[0].quantity;

  // Determine update type
  const updateType = isNew ? "new" : updatedSeats > currentSeats ? "upgrade" : updatedSeats < currentSeats ? "downgrade" : "na";

  // Set new billing data
  const data = {

    // Customer id
    customerId: subscription.customer,

    // Subscription id
    subscriptionId: subscription.id,

    // Save seats
    seats: updatedSeats,

    // Subscription status, trialing, active, canceled
    status: subscription.status, 

    // Update type
    updateType,

    // Add billing metadata
    createdAt: isNew ? new Date().toISOString() : new Date(subscription.created * 1000).toISOString(), // Convert to milliseconds

    updatedAt: new Date().toISOString()

  };

  // Update Clerk organization with billing data
  await clerk.organizations.updateOrganization(organizationId, {

    publicMetadata: {
    
      ...org.publicMetadata,

      billing: data
    
    }

  });

}
