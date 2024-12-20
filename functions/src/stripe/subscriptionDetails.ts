import * as functions from 'firebase-functions';
import { stripe } from './stripeClient';
import Stripe from 'stripe';

export const getSubscriptionDetails = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    console.error('Authentication required');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to view subscription details'
    );
  }

  try {
    const email = context.auth.token.email;
    console.log('Fetching subscription details for email:', email);

    if (!email) {
      console.error('No email found in auth token');
      return { 
        status: 'no_subscription',
        debug: { error: 'No email found in auth token', step: 'email_check' }
      };
    }

    // Get customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return { 
        status: 'no_subscription',
        debug: { email, customersFound: 0, step: 'customer_check', error: 'No Stripe customer found' }
      };
    }

    const customerId = customers.data[0].id;

    // Get subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price'], // Limit expansion depth
    });

    if (!subscriptions.data.length) {
      return { 
        status: 'no_subscription',
        debug: { email, stripeCustomerId: customerId, step: 'subscription_check', error: 'No active subscriptions found' }
      };
    }

    const subscription = subscriptions.data[0];
    const price = subscription.items.data[0].price;

    // Fetch product details separately
    const product = await stripe.products.retrieve(price.product as string);

    const details = {
      status: 'active',
      planId: price.id,
      planName: product.name,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      debug: {
        email,
        stripeCustomerId: customerId,
        step: 'complete',
      },
    };

    console.log('Returning subscription details:', JSON.stringify(details, null, 2));
    return details;
  } catch (error) {
    console.error('Error in getSubscriptionDetails:', error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe-specific error details:', error.raw);
      throw new functions.https.HttpsError(
        'internal',
        `Stripe error: ${error.message}`
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch subscription details. Please try again later.'
    );
  }
});
