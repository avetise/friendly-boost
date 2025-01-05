"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = require("stripe");
const dotenv = require("dotenv");
dotenv.config();
exports.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
});
//# sourceMappingURL=stripeClient.js.map