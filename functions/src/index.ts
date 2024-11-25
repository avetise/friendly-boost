import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
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
      await stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error('Price retrieval error:', error);
      throw new functions.https.HttpsError(
        'invalid-argument',
        `The price ID ${priceId} does not exist in your Stripe account. Please verify the price ID.`
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
    });

    return { sessionId: session.id };
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const handleSubscriptionStatusChange = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

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
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});