import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
