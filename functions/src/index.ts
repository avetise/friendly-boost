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
    const email = context.auth.token.email;
    console.log('Processing cancellation for email:', email);

    if (!email) {
      console.error('No email found in auth token');
      return { 
        status: 'error',
        debug: { error: 'No email found in auth token', step: 'email_check' }
      };
    }

    if (!subscriptionId) {
      console.error('No subscription ID provided');
      return {
        status: 'error',
        debug: { error: 'Subscription ID is required', step: 'subscription_check' }
      };
    }

    // Get customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return { 
        status: 'error',
        debug: { email, customersFound: 0, step: 'customer_check', error: 'No Stripe customer found' }
      };
    }

    const customerId = customers.data[0].id;

    // Verify subscription ownership
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.customer !== customerId) {
      return {
        status: 'error',
        debug: { 
          email, 
          subscriptionId,
          customerId,
          step: 'ownership_check',
          error: 'Subscription does not belong to this customer'
        }
      };
    }

    // Cancel at period end
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('Subscription marked for cancellation:', updatedSubscription);
    
    return { 
      status: 'success',
      subscription: updatedSubscription,
      debug: {
        email,
        customerId,
        step: 'complete'
      }
    };
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      throw new functions.https.HttpsError(
        'internal',
        `Stripe error: ${error.message}`
      );
    }
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});
