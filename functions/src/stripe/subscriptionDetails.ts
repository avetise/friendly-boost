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
        debug: {
          error: 'No email found in auth token',
          step: 'email_check'
        }
      };
    }

    // Get customer by email
    console.log('Querying Stripe for customer with email:', email);
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    console.log('Stripe customers query result:', JSON.stringify(customers, null, 2));

    if (!customers.data.length) {
      console.log('No Stripe customer found for email:', email);
      return { 
        status: 'no_subscription',
        debug: {
          email: email,
          customersFound: 0,
          step: 'customer_check',
          error: 'No Stripe customer found'
        }
      };
    }

    const customerId = customers.data[0].id;
    console.log('Found Stripe customer ID:', customerId);

    // Get subscription details directly from Stripe
    console.log('Querying active subscriptions for customer:', customerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price.product'],
    });

    console.log('Subscriptions found:', subscriptions.data.length);

    if (!subscriptions.data.length) {
      console.log('No active subscriptions found for customer:', customerId);
      return { 
        status: 'no_subscription',
        debug: {
          email: email,
          customersFound: 1,
          stripeCustomerId: customerId,
          step: 'subscription_check',
          error: 'No active subscriptions found'
        }
      };
    }

    const subscription = subscriptions.data[0];
    const product = subscription.items.data[0].price.product as Stripe.Product;

    const details = {
      status: 'active',
      planId: subscription.items.data[0].price.id,
      planName: product.name,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      debug: {
        email: email,
        customersFound: 1,
        stripeCustomerId: customerId,
        step: 'complete'
      }
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