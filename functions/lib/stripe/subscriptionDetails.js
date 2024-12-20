"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionDetails = void 0;
const functions = require("firebase-functions");
const stripeClient_1 = require("./stripeClient");
const stripe_1 = require("stripe");
exports.getSubscriptionDetails = functions.https.onCall(async (data, context) => {
    if (!(context === null || context === void 0 ? void 0 : context.auth)) {
        console.error('Authentication required');
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view subscription details');
    }
    try {
        const email = context.auth.token.email;
        console.log('Fetching subscription details for email:', email);
        if (!email) {
            console.error('No email found in auth token');
            return {
                status: 'no_subscription',
                debug: { error: 'No email found in auth token', step: 'email_check' }
            };
        }
        // Get customer by email
        const customers = await stripeClient_1.stripe.customers.list({ email, limit: 1 });
        if (!customers.data.length) {
            return {
                status: 'no_subscription',
                debug: { email, customersFound: 0, step: 'customer_check', error: 'No Stripe customer found' }
            };
        }
        const customerId = customers.data[0].id;
        // Get subscription details
        const subscriptions = await stripeClient_1.stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            expand: ['data.items.data.price'], // Limit expansion depth
        });
        if (!subscriptions.data.length) {
            return {
                status: 'no_subscription',
                debug: { email, stripeCustomerId: customerId, step: 'subscription_check', error: 'No active subscriptions found' }
            };
        }
        const subscription = subscriptions.data[0];
        const price = subscription.items.data[0].price;
        // Fetch product details separately
        const product = await stripeClient_1.stripe.products.retrieve(price.product);
        const details = {
            status: 'active',
            planId: price.id,
            planName: product.name,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            debug: {
                email,
                stripeCustomerId: customerId,
                step: 'complete',
            },
        };
        console.log('Returning subscription details:', JSON.stringify(details, null, 2));
        return details;
    }
    catch (error) {
        console.error('Error in getSubscriptionDetails:', error);
        // Handle Stripe-specific errors
        if (error instanceof stripe_1.default.errors.StripeError) {
            console.error('Stripe-specific error details:', error.raw);
            throw new functions.https.HttpsError('internal', `Stripe error: ${error.message}`);
        }
        throw new functions.https.HttpsError('internal', 'Failed to fetch subscription details. Please try again later.');
    }
});
//# sourceMappingURL=subscriptionDetails.js.map