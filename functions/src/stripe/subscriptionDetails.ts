import * as functions from 'firebase-functions';
import { stripe } from './stripeClient';

export const getSubscriptionDetails = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to view subscription details'
    );
  }

  try {
    const email = context.auth.token.email;
    
    // Get customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (!customers.data.length) {
      return { status: 'no_subscription' };
    }

    // Get subscription details directly from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      expand: ['data.plan.product']
    });

    if (!subscriptions.data.length) {
      return { status: 'no_subscription' };
    }

    const subscription = subscriptions.data[0];
    return {
      status: 'active',
      planId: subscription.items.data[0].price.id,
      planName: subscription.items.data[0].price.product.name,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch subscription details');
  }
});