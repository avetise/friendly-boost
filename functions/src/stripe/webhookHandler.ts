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
        const customerEmail = session.customer_details.email;
        const customerId = session.customer;
        
        console.log(`Processing checkout completion for customer email ${customerEmail}`);
        
        // Find user by email
        const usersRef = admin.firestore().collection('users');
        const userSnapshot = await usersRef.where('email', '==', customerEmail).get();
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await userDoc.ref.update({
            stripeCustomerId: customerId
          });
          console.log(`Updated user ${userDoc.id} with Stripe customer ID ${customerId}`);
        } else {
          console.error(`No user found with email ${customerEmail}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerEmail = subscription.customer_email;
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;

        console.log(`Processing subscription ${event.type} for customer email ${customerEmail}`);
        console.log(`Subscription status: ${status}, priceId: ${priceId}`);

        // Find user by email
        const usersRef = admin.firestore().collection('users');
        const userSnapshot = await usersRef.where('email', '==', customerEmail).get();

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userRole = priceId === 'price_1OubchBsWcSPhj7FZGoenAWG' ? 'Pro' :
                          (priceId === 'price_1OubcUBsWcSPhj7FIozkfeGh' ? 'Premium' : 'Standard');
          
          // If the subscription is marked for cancellation at period end
          const updates: any = {
            subscriptionStatus: status,
            subscriptionId: subscription.id,
            role: userRole,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          if (subscription.cancel_at_period_end) {
            updates.cancelAtPeriodEnd = true;
            updates.cancelAt = subscription.cancel_at;
          }
          
          console.log(`Updating user ${userDoc.id} with role ${userRole} and subscription status ${status}`);
          await userDoc.ref.update(updates);
        } else {
          console.error(`No user found with email ${customerEmail}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerEmail = subscription.customer_email;

        console.log(`Processing subscription deletion for customer email ${customerEmail}`);

        const usersRef = admin.firestore().collection('users');
        const userSnapshot = await usersRef.where('email', '==', customerEmail).get();

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'canceled',
            role: 'Standard',
            subscriptionId: null,
            cancelAtPeriodEnd: true,
            cancelAt: subscription.cancel_at,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Updated user ${userDoc.id} subscription status to canceled`);
        } else {
          console.error(`No user found with email ${customerEmail}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerEmail = invoice.customer_email;
        
        console.log(`Processing successful payment for customer email ${customerEmail}`);
        
        const usersRef = admin.firestore().collection('users');
        const userSnapshot = await usersRef.where('email', '==', customerEmail).get();

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await userDoc.ref.update({
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          console.error(`No user found with email ${customerEmail}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerEmail = invoice.customer_email;
        
        console.log(`Processing failed payment for customer email ${customerEmail}`);
        
        const usersRef = admin.firestore().collection('users');
        const userSnapshot = await usersRef.where('email', '==', customerEmail).get();

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await userDoc.ref.update({
            lastPaymentStatus: 'failed',
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          console.error(`No user found with email ${customerEmail}`);
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