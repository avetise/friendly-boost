"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const functions = require("firebase-functions");
const stripe_1 = require("stripe");
const stripeClient_1 = require("./stripeClient");
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!(context === null || context === void 0 ? void 0 : context.auth)) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a checkout session');
    }
    try {
        const { priceId } = data;
        const userId = context.auth.uid;
        const userEmail = context.auth.token.email || undefined;
        // Verify the price exists
        try {
            console.log('Attempting to retrieve price with ID:', priceId);
            const retrievedPrice = await stripeClient_1.stripe.prices.retrieve(priceId);
            console.log('Retrieved price:', retrievedPrice);
        }
        catch (error) {
            console.error('Price retrieval error:', error);
            throw new functions.https.HttpsError('invalid-argument', `The price ID ${priceId} does not exist in your Stripe account.`);
        }
        const session = await stripeClient_1.stripe.checkout.sessions.create({
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
            client_reference_id: userId,
            metadata: {
                userId: userId,
                userEmail: userEmail || ''
            },
            automatic_tax: {
                enabled: true,
            },
        });
        console.log('Checkout session created successfully:', session);
        return { sessionId: session.id };
    }
    catch (error) {
        console.error('Checkout session creation error:', error);
        if (error instanceof stripe_1.default.errors.StripeError) {
            console.error('Stripe-specific error details:', error.raw);
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'An unexpected error occurred');
    }
});
//# sourceMappingURL=checkoutSession.js.map