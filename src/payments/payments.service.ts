import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/envs.js';

@Injectable()
export class PaymentsService {

    private readonly stripe = new Stripe(
        envs.stripe
    )

}
