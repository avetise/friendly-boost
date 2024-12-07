"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionStatusChange = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const stripeClient_1 = require("./stripeClient");
const app = express();
const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook Headers:', req.headers);
        console.log('Raw Body:', req.rawBody);
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            console.error('No Stripe signature found');
            res.status(400).send('Missing Stripe signature');
            return;
        }
        const event = stripeClient_1.stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
        console.log('Webhook event type:', event.type);
        console.log('Webhook event data:', JSON.stringify(event.data));
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.client_reference_id;
            const customerId = session.customer;
            // Update user with Stripe customer ID
            await admin.firestore().collection('users').doc(userId).update({
                stripeCustomerId: customerId
            });
        }
        if (event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const status = subscription.status;
            const priceId = subscription.items.data[0].price.id;
            // Get user by customerId
            const usersRef = admin.firestore().collection('users');
            const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
            if (!snapshot.empty) {
                const userId = snapshot.docs[0].id;
                const userRole = priceId === 'price_1OubchBsWcSPhj7FZGoenAWG' ? 'Pro' :
                    (priceId === 'price_1OubcUBsWcSPhj7FIozkfeGh' ? 'Premium' : 'Basic');
                console.log(`Updating user ${userId} with role ${userRole} and subscription status ${status}`);
                await usersRef.doc(userId).update({
                    subscriptionStatus: status,
                    subscriptionId: subscription.id,
                    role: userRole,
                });
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
app.post('/webhook', handleWebhook);
exports.handleSubscriptionStatusChange = functions.https.onRequest(app);
//# sourceMappingURL=webhookHandler.js.map