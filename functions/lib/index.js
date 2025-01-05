"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const subscriptionDetails_1 = require("./stripe/subscriptionDetails");
dotenv.config();
admin.initializeApp();
const app = express();
// Raw body parsing middleware with proper types
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    },
}));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
});
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!(context === null || context === void 0 ? void 0 : context.auth)) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a checkout session');
    }
    try {
        const { priceId } = data;
        const userEmail = context.auth.token.email;
        if (!userEmail) {
            throw new functions.https.HttpsError('invalid-argument', 'User email is required to create a checkout session.');
        }
        try {
            console.log('Attempting to retrieve price with ID:', priceId);
            const retrievedPrice = await stripe.prices.retrieve(priceId);
            console.log('Retrieved price:', retrievedPrice);
        }
        catch (error) {
            console.error('Price retrieval error:', error);
            throw new functions.https.HttpsError('invalid-argument', `The price ID ${priceId} does not exist in your Stripe account. Please verify the price ID.`);
        }
        console.log('Creating checkout session with the following details:');
        console.log('Price ID:', priceId);
        console.log('User Email:', userEmail);
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
            customer_email: userEmail,
            automatic_tax: {
                enabled: true,
            },
        });
        console.log('Checkout session created successfully:', session);
        return { sessionId: session.id };
    }
    catch (error) {
        console.error('Checkout session creation error:', error);
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
    }
});
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    try {
        if (!sig || !webhookSecret) {
            throw new Error('Missing stripe signature or webhook secret');
        }
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        console.log('Processing webhook event:', event.type);
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                console.log('Subscription event:', subscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (err) {
        console.error('Webhook error:', err);
        if (err instanceof Error) {
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
        else {
            res.status(400).send('Webhook Error: An unknown error occurred');
        }
    }
};
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
    if (!(context === null || context === void 0 ? void 0 : context.auth)) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to cancel a subscription');
    }
    try {
        const email = context.auth.token.email;
        console.log('Processing cancellation for email:', email);
        if (!email) {
            console.error('No email found in auth token');
            return {
                status: 'error',
                message: 'No email found in auth token'
            };
        }
        const { subscriptionId } = data;
        if (!subscriptionId) {
            console.error('No subscription ID provided');
            return {
                status: 'error',
                message: 'Subscription ID is required'
            };
        }
        // Get customer by email
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (!customers.data.length) {
            return {
                status: 'error',
                message: 'No Stripe customer found'
            };
        }
        const customerId = customers.data[0].id;
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.customer !== customerId) {
            return {
                status: 'error',
                message: 'Subscription does not belong to this customer'
            };
        }
        // Cancel at period end
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
        console.log('Subscription marked for cancellation:', updatedSubscription);
        return {
            status: 'success',
            subscription: updatedSubscription
        };
    }
    catch (error) {
        console.error('Subscription cancellation error:', error);
        if (error instanceof stripe_1.default.errors.StripeError) {
            throw new functions.https.HttpsError('internal', `Stripe error: ${error.message}`);
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'An unexpected error occurred');
    }
});
app.post('/webhook', handleWebhook);
exports.handleSubscriptionStatusChange = functions.https.onRequest(app);
exports.getSubscriptionDetails = subscriptionDetails_1.getSubscriptionDetails;
//# sourceMappingURL=index.js.map