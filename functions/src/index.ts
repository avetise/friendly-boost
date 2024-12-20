import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { getSubscriptionDetails } from './stripe/subscriptionDetails';

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

// Export the getSubscriptionDetails function
export { getSubscriptionDetails };

const handleWebhook = async (req: express.Request, res: express.Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret');
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );

    console.log('Processing webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log('Subscription event:', subscription);
        // Handle subscription event
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

app.post('/webhook', handleWebhook);

export const handleSubscriptionStatusChange = functions.https.onRequest(app);
