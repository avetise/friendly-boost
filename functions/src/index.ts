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
      // Save raw body for Stripe signature verification
      req.rawBody = buf.toString();
    }
  })
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const handleWebhook = async (req: express.Request, res: express.Response) => {
  try {
    console.log('Webhook Headers:', req.headers);
    console.log('Raw Body:', (req as any).rawBody);

    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      console.error('No Stripe signature found');
      res.status(400).send('Missing Stripe signature');
      return;
    }

    const event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    console.log('Webhook event type:', event.type);
    console.log('Webhook event data:', JSON.stringify(event.data));

    // Your existing event handling logic
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      // Get user by customerId from your database
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

      if (!snapshot.empty) {
        const userId = snapshot.docs[0].id;
        await usersRef.doc(userId).update({
          subscriptionStatus: status,
          subscriptionId: subscription.id,
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

app.post('/webhook', handleWebhook);

export const handleSubscriptionStatusChange = functions.https.onRequest(app);

export const createCheckoutSession = functions.https.onCall(async (data: { priceId: string }, context: functions.https.CallableContext) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a checkout session'
    );
  }

  try {
    const { priceId } = data;
    const userId = context.auth.uid;

    // Verify the price exists before creating the session
    try {
      console.log('Attempting to retrieve price with ID:', priceId);
      const retrievedPrice = await stripe.prices.retrieve(priceId);
      console.log('Retrieved price:', retrievedPrice);
    } catch (error) {
      console.error('Price retrieval error:', error);

      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('Missing Stripe secret key in environment variables.');
      }

      if (typeof priceId !== 'string' || !priceId.trim()) {
        console.error('Invalid or empty priceId provided:', priceId);
      }

      throw new functions.https.HttpsError(
        'invalid-argument',
        `The price ID ${priceId} does not exist in your Stripe account. Please verify the price ID.`
      );
    }

    console.log('Creating checkout session with the following details:');
    console.log('Price ID:', priceId);
    console.log('User ID:', userId);
    console.log('Success URL:', process.env.WEBAPP_URL + '/success?session_id={CHECKOUT_SESSION_ID}');
    console.log('Cancel URL:', process.env.WEBAPP_URL + '/');
    console.log('Customer Email:', context.auth.token.email);

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
      
      // New optional configurations for 2024-11-20
      automatic_tax: {
        enabled: true, // Enable automatic tax calculation
      },
      payment_intent_data: {
        setup_future_usage: 'off_session', // Optional: allow future payments
      },
    });

    console.log('Checkout session created successfully:', session);
    return { sessionId: session.id };
  } catch (error) {
    console.error('Checkout session creation error:', error);

    // Stripe-specific error logging
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe-specific error details:', error.raw);
    }

    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', error.message);
    }

    throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
  }
});
