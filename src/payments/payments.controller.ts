import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentSessionDto } from './dto/payment-session.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}


  @Post('create-payment-session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto){
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success(){
    return{
      ok: true,
      message: 'Payment successful'
    }
  }

  @Get('cancelled')
  cancel(){
    return{
      ok: false,
      message: 'Payment cancelled'
    }
  }

  @Post('webhook')
  async stripeWebhook(){
    return 'stripeWebhook'
  }

}
