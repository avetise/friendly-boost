"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSubscriptionToLocalStorage = exports.getSubscriptionDetailsFromStripe = exports.determineSubscriptionStatus = exports.updateUserSubscription = void 0;
const admin = require("firebase-admin");
const stripeClient_1 = require("../stripe/stripeClient");
//import Stripe from 'stripe';
const updateUserSubscription = async (userDoc, updates) => {
    await userDoc.ref.update(Object.assign(Object.assign({}, updates), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
};
exports.updateUserSubscription = updateUserSubscription;
const determineSubscriptionStatus = (priceId) => {
    switch (priceId) {
        case 'price_1Qa559BsWcSPhj7F6nKmQRR4':
            return 'Premium';
        default:
            return 'Standard';
    }
};
exports.determineSubscriptionStatus = determineSubscriptionStatus;
const getSubscriptionDetailsFromStripe = async (email) => {
    const customers = await stripeClient_1.stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length)
        throw new Error('No Stripe customer found');
    const customerId = customers.data[0].id;
    const subscriptions = await stripeClient_1.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        expand: ['data.items.data.price'],
    });
    if (!subscriptions.data.length)
        throw new Error('No active subscriptions found');
    const subscription = subscriptions.data[0];
    const price = subscription.items.data[0].price;
    const product = await stripeClient_1.stripe.products.retrieve(price.product);
    return {
        status: 'active',
        planId: price.id,
        planName: product.name,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at,
    };
};
exports.getSubscriptionDetailsFromStripe = getSubscriptionDetailsFromStripe;
const saveSubscriptionToLocalStorage = (details) => {
    localStorage.setItem('subscriptionType', details.planName);
    localStorage.setItem('subscriptionExpiry', details.currentPeriodEnd.toString());
};
exports.saveSubscriptionToLocalStorage = saveSubscriptionToLocalStorage;
//# sourceMappingURL=stripeUtils.js.map