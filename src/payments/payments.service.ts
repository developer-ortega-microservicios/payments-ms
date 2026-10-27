import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/envs.js';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripe)

    async createPaymentSession() {
        const session = await this.stripe.checkout.sessions.create({
            // Colocar aqui el ID de mi orden
            payment_intent_data: {
                metadata: {}
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'T-Shirt'
                        },
                        unit_amount: 2000, // 20 Dólares
                    },
                    quantity: 2
                }
            ],
            mode: 'payment',
            success_url: 'http://localhost:3003/payments/success',
            cancel_url: 'http://localhost:3003/payments/cancelled'
        });

        return session;
    }

}
