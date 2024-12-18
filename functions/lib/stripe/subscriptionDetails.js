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
    // Input validation: Ensure no unexpected fields
    const allowedFields = ['email'];
    const extraFields = Object.keys(data).filter(key => !allowedFields.includes(key));
    if (extraFields.length > 0) {
        console.warn('Request body has extra fields:', extraFields.join(', '));
        throw new functions.https.HttpsError('invalid-argument', `Invalid request body. Only allowed fields: ${allowedFields.join(', ')}`);
    }
    try {
        const email = context.auth.token.email;
        console.log('Fetching subscription details for email:', email);
        // Get customer by email
        const customers = await stripeClient_1.stripe.customers.list({
            email: email,
            limit: 1,
        });
        console.log('Found customers:', customers.data.length);
        if (!customers.data.length) {
            console.log('No customer found for email:', email);
            return { status: 'no_subscription' };
        }
        // Get subscription details directly from Stripe
        const subscriptions = await stripeClient_1.stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'active',
            expand: ['data.items.data.price.product'],
        });
        console.log('Found subscriptions:', subscriptions.data.length);
        if (!subscriptions.data.length) {
            console.log('No active subscriptions found for customer');
            return { status: 'no_subscription' };
        }
        const subscription = subscriptions.data[0];
        const product = subscription.items.data[0].price.product;
        const details = {
            status: 'active',
            planId: subscription.items.data[0].price.id,
            planName: product.name,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
        console.log('Returning subscription details:', details);
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