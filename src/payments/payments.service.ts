import { BadRequestException, Injectable, RawBodyRequest } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/envs.js';
import { PaymentSessionDto } from './dto/payment-session.dto.js';
import type { Request, Response } from 'express';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripe)

    async createPaymentSession(paymentSessionDto: PaymentSessionDto) {

        const { currency, items } = paymentSessionDto;
        const lineItems = items.map(item => {
            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: item.name
                    },
                    unit_amount: Math.round(item.price * 100), // 20 Dólares
                },
                quantity: item.quantity
            }
        })

        const session = await this.stripe.checkout.sessions.create({
            // Colocar aqui el ID de mi orden
            payment_intent_data: {
                metadata: {}
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:3003/payments/success',
            cancel_url: 'http://localhost:3003/payments/cancelled'
        });

        return session;
    }

    async stripeWebhook(req: RawBodyRequest<Request>, res: Response) {
        const sig = req.headers['stripe-signature'];

        if (!sig || !req.rawBody) {
            throw new BadRequestException('Missing Stripe signature or raw body');
        }

        let event: Stripe.Event;
        const endpointSecret = envs.StripeEndpointSecret


        try {
            event = this.stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        } catch (error: any) {
            res.status(400).send(`WebHook Error: ${error.message}`);
            return;
        }

        switch( event.type ){
            case 'charge.succeeded':
                //TODO llamar nuestro microservicio
                console.log(event);
            break;

            default:
                console.log(`Event ${event.type} not handled`)
        }

        return res.status(200).json({ sig });
    }

}
