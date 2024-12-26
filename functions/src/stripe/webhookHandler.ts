import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { stripe } from './stripeClient';

const app = express();

const getUserByEmail = async (email: string) => {
  const usersRef = admin.firestore().collection('users');
  const userSnapshot = await usersRef.where('email', '==', email).limit(1).get();
  return userSnapshot.empty ? null : userSnapshot.docs[0];
};

const determineSubscriptionStatus = (priceId: string): string => {
  switch (priceId) {
   /*  case 'price_1OubchBsWcSPhj7FZGoenAWG':
      return 'Pro'; */
    case 'price_1Qa559BsWcSPhj7F6nKmQRR4':
      return 'Premium';
    default:
      return 'Standard';
  }
};

const updateUserSubscription = async (userDoc: FirebaseFirestore.QueryDocumentSnapshot, updates: any) => {
  await userDoc.ref.update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const handleSubscriptionEvent = async (event: any) => {
  const subscription = event.data.object;
  const customerEmail = subscription.customer_email;
  const priceId = subscription.items.data[0].price.id;
  const subscriptionStatus = determineSubscriptionStatus(priceId);

  console.log(`Processing subscription event for ${customerEmail}: ${subscriptionStatus}`);

  const userDoc = await getUserByEmail(customerEmail);
  if (!userDoc) {
    console.error(`No user found for email ${customerEmail}`);
    return;
  }

  const userRole = userDoc.data().role;
  if (userRole !== 'Standard' && subscriptionStatus === 'Standard') {
    console.log('No update required for non-Standard users.');
    return;
  }

  const updates: {
    subscriptionStatus: string;
    subscriptionId: string | null;
    role: string;
    updatedAt: FirebaseFirestore.FieldValue;
    cancelAtPeriodEnd?: boolean;
    cancelAt?: number | null;
  } = {
    subscriptionStatus: status,
    subscriptionId: subscription.id,
    role: userRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (subscription.cancel_at_period_end) {
    updates.cancelAtPeriodEnd = true;
    updates.cancelAt = subscription.cancel_at;
  }

  console.log(`Updating user ${userDoc.id} with subscription status:`, updates);
  await updateUserSubscription(userDoc, updates);
};

app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

export const handleSubscriptionStatusChange = functions.https.onRequest(app);
