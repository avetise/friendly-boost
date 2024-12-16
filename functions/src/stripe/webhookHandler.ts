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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const customerId = session.customer;
        
        console.log(`Processing checkout completion for user ${userId} with customer ${customerId}`);
        
        // Update user with Stripe customer ID
        await admin.firestore().collection('users').doc(userId).update({
          stripeCustomerId: customerId
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;

        console.log(`Processing subscription ${event.type} for customer ${customerId}`);
        console.log(`Subscription status: ${status}, priceId: ${priceId}`);

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
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          console.error(`No user found for customer ID: ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        console.log(`Processing subscription deletion for customer ${customerId}`);

        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          await usersRef.doc(userId).update({
            subscriptionStatus: 'canceled',
            role: 'Basic',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        
        console.log(`Processing successful payment for customer ${customerId}`);
        
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          await usersRef.doc(userId).update({
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        
        console.log(`Processing failed payment for customer ${customerId}`);
        
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          await usersRef.doc(userId).update({
            lastPaymentStatus: 'failed',
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
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