import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { NatsModule } from '../transports/nats.module.js';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [NatsModule]
})
export class PaymentsModule {}
