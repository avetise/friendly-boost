import * as admin from 'firebase-admin';
import { createCheckoutSession } from './stripe/checkoutSession';
import { getSubscriptionDetails } from './stripe/subscriptionDetails';
import { handleSubscriptionStatusChange } from './stripe/webhookHandler';

admin.initializeApp();

export {
  createCheckoutSession,
  getSubscriptionDetails,
  handleSubscriptionStatusChange,
};