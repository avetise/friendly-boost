import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { stripe } from './stripeClient';

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a checkout session'
    );
  }

  try {
    const { priceId } = data;
    const userId = context.auth.uid;

    // Verify the price exists
    try {
      console.log('Attempting to retrieve price with ID:', priceId);
      const retrievedPrice = await stripe.prices.retrieve(priceId);
      console.log('Retrieved price:', retrievedPrice);
    } catch (error) {
      console.error('Price retrieval error:', error);
      throw new functions.https.HttpsError(
        'invalid-argument',
        `The price ID ${priceId} does not exist in your Stripe account.`
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.WEBAPP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEBAPP_URL}/`,
      customer_email: context.auth.token.email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        userEmail: context.auth.token.email
      },
      automatic_tax: {
        enabled: true,
      },
    });

    console.log('Checkout session created successfully:', session);
    return { sessionId: session.id };
  } catch (error) {
    console.error('Checkout session creation error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe-specific error details:', error.raw);
    }
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'An unexpected error occurred');
  }
});