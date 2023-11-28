import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_PRODUCER } from '../common/constants';

@Global()
@Module({
  providers: [
    {
      provide: Kafka,
      useFactory: (config: ConfigService) => {
        return new Kafka({
          clientId: config.get<string>('KAFKA_CLIENT_ID'),
          brokers: config.get<string>('KAFKA_BROKERS')!.split(','),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: KAFKA_PRODUCER,
      useFactory: async (kafka: Kafka) => {
        const producer: Producer = kafka.producer();
        await producer.connect();
        return producer;
      },
      inject: [Kafka],
    },
  ],
  exports: [KAFKA_PRODUCER, Kafka],
})
export class KafkaModule {}
