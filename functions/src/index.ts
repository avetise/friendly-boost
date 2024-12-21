import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { getSubscriptionDetails } from './stripe/subscriptionDetails';
import { createCheckoutSession } from './stripe/checkoutSession';

declare global {
  namespace Express {
    interface Request {
      rawBody: string;
    }
  }
}

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

exports.createCheckoutSession = createCheckoutSession;

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
      /* case 'customer.subscription.canceled':
        const canceledSubscription = event.data.object;
        const customerEmail = canceledSubscription.customer_email;

        console.log(`Processing subscription cancellation for customer email ${customerEmail}`);

        const usersRef = admin.firestore().collection('users');
        const userSnapshot = await usersRef.where('email', '==', customerEmail).get();

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'canceled',
            role: 'Standard',
            subscriptionId: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Updated user ${userDoc.id} subscription status to canceled`);
        } else {
          console.error(`No user found with email ${customerEmail}`);
        }
        break; */
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    if (err instanceof Error) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    } else {
      res.status(400).send('Webhook Error: An unknown error occurred');
    }
  }
};

app.post('/webhook', handleWebhook);

exports.handleSubscriptionStatusChange = functions.https.onRequest(app);

exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to cancel a subscription'
    );
  }

  try {
    const { subscriptionId } = data;
    
    if (!subscriptionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Subscription ID is required to cancel a subscription'
      );
    }

    console.log(`Canceling subscription ${subscriptionId} for user ${context.auth.uid}`);

    await stripe.subscriptions.cancel(subscriptionId);

    console.log('Subscription cancelled successfully');
    return { success: true };
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});
