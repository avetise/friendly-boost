import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

dotenv.config();

admin.initializeApp();

const app = express();

// Raw body parsing middleware
app.use(
  bodyParser.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a checkout session'
    );
  }

  try {
    const { priceId } = data;
    const userEmail = context.auth.token.email;

    if (!userEmail) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User email is required to create a checkout session.'
      );
    }

    // Verify the price exists before creating the session
    try {
      console.log('Attempting to retrieve price with ID:', priceId);
      const retrievedPrice = await stripe.prices.retrieve(priceId);
      console.log('Retrieved price:', retrievedPrice);
    } catch (error) {
      console.error('Price retrieval error:', error);
      throw new functions.https.HttpsError(
        'invalid-argument',
        `The price ID ${priceId} does not exist in your Stripe account. Please verify the price ID.`
      );
    }

    console.log('Creating checkout session with the following details:');
    console.log('Price ID:', priceId);
    console.log('User Email:', userEmail);

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
      customer_email: userEmail,
      automatic_tax: {
        enabled: true,
      },
    });

    console.log('Checkout session created successfully:', session);
    return { sessionId: session.id };
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
  }
});

// Add new function to get subscription details
export const getSubscriptionDetails = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to view subscription details'
    );
  }

  try {
    const userEmail = context.auth.token.email;

    if (!userEmail) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User email is required to fetch subscription details.'
      );
    }

    // Get user's Stripe customer ID from Firestore
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', userEmail)
      .get();

    if (userSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No user found with the provided email.'
      );
    }

    const userData = userSnapshot.docs[0].data();

    if (!userData?.stripeCustomerId) {
      return { status: 'no_subscription' };
    }

    // Get subscription details from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active',
      expand: ['data.plan.product'],
    });

    if (!subscriptions.data.length) {
      return { status: 'no_subscription' };
    }

    const subscription = subscriptions.data[0];
    return {
      status: 'active',
      planId: subscription.items.data[0].price.id,
      planName: (subscription.items.data[0].price.product as Stripe.Product).name,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch subscription details');
  }
});

const handleWebhook = async (req: express.Request, res: express.Response) => {
  // Webhook handler logic remains unchanged
};

app.post('/webhook', handleWebhook);

export const handleSubscriptionStatusChange = functions.https.onRequest(app);
