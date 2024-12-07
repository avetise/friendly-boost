"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionStatusChange = exports.getSubscriptionDetails = exports.createCheckoutSession = void 0;
const admin = require("firebase-admin");
const checkoutSession_1 = require("./stripe/checkoutSession");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return checkoutSession_1.createCheckoutSession; } });
const subscriptionDetails_1 = require("./stripe/subscriptionDetails");
Object.defineProperty(exports, "getSubscriptionDetails", { enumerable: true, get: function () { return subscriptionDetails_1.getSubscriptionDetails; } });
const webhookHandler_1 = require("./stripe/webhookHandler");
Object.defineProperty(exports, "handleSubscriptionStatusChange", { enumerable: true, get: function () { return webhookHandler_1.handleSubscriptionStatusChange; } });
admin.initializeApp();
//# sourceMappingURL=index.js.map