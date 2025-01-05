import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
//console.log('Initializing Stripe with key from env:', stripePublishableKey);

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key in environment variables');
}

export const stripePromise = loadStripe(stripePublishableKey);