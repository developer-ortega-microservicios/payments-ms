import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module.js';
import { HealthCheckModule } from './health-check/health-check.module.js';


@Module({
  imports: [PaymentsModule, HealthCheckModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
