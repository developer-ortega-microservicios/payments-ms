import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from '../config/envs.js';
import { NATS_SERVICE } from '../config/service.js';


@Module({
    imports: [
        ClientsModule.register([
            {
                name: NATS_SERVICE,
                transport: Transport.NATS,
                options: {
                    servers: envs.natsServers
                }
            }
        ])
    ],
    exports: [
        ClientsModule.register([
            {
                name: NATS_SERVICE,
                transport: Transport.NATS,
                options: {
                    servers: envs.natsServers
                }
            }
        ])
    ]
})
export class NatsModule { }
