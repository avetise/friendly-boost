import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { stripe } from './stripeClient';

const app = express();

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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      
      // Update user with Stripe customer ID
      await admin.firestore().collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }

    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;
      const priceId = subscription.items.data[0].price.id;

      // Get user by customerId
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

      if (!snapshot.empty) {
        const userId = snapshot.docs[0].id;
        const userRole = priceId === 'price_1OubchBsWcSPhj7FZGoenAWG' ? 'Pro' : 
                        (priceId === 'price_1OubcUBsWcSPhj7FIozkfeGh' ? 'Premium' : 'Basic');
        
        console.log(`Updating user ${userId} with role ${userRole} and subscription status ${status}`);
        
        await usersRef.doc(userId).update({
          subscriptionStatus: status,
          subscriptionId: subscription.id,
          role: userRole,
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