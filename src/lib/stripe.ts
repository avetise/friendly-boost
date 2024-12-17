import { loadStripe } from '@stripe/stripe-js';

console.log('Initializing Stripe with key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);