import { BadRequestException, Inject, Injectable, Logger, RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { envs } from '../config/envs.js';
import { PaymentSessionDto } from './dto/payment-session.dto.js';
import { NATS_SERVICE } from '../config/service.js';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(envs.stripe)
    private readonly logger = new Logger('PaymentsService')

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy
    ){}

    async createPaymentSession(paymentSessionDto: PaymentSessionDto) {

        const { currency, items, orderId } = paymentSessionDto;
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
                metadata: {
                    orderId: orderId
                }
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl
        });

        return {
            cancelUrl: session.cancel_url,
            successUrl: session.success_url,
            url: session.url
        };
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
            case 'payment_intent.succeeded':
                const chargeSucceeded = event.data.object;
                const payload = {
                    stripePaymentId: chargeSucceeded.id,
                    orderId: chargeSucceeded.metadata.orderId,
                    receiptUrl: chargeSucceeded.receipt_email
                }
                this.client.emit('payment.succeeded', payload);
            break;

            default:
                console.log(`Event ${event.type} not handled`)
        }

        return res.status(200).json({ sig });
    }

}
