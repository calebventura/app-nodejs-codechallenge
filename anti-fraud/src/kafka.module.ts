import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Partitioners } from 'kafkajs';

@Global()
@Module({
  providers: [
    {
      provide: Kafka,
      useFactory: (config: ConfigService) => {
        const clientId = config.get<string>('KAFKA_CLIENT_ID');
        const brokers = config.get<string>('KAFKA_BROKERS')!.split(',');
        return new Kafka({ clientId, brokers });
      },
      inject: [ConfigService],
    },
    {
      provide: 'KAFKA_PRODUCER',
      useFactory: async (kafka: Kafka) => {
        const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
        await producer.connect();
        return producer;
      },
      inject: [Kafka],
    },
    {
      provide: 'KAFKA_CONSUMER',
      useFactory: async (config: ConfigService, kafka: Kafka) => {
        const groupId = config.get<string>('KAFKA_CONSUMER_GROUP_ID')!;
        const consumer = kafka.consumer({ groupId });
        await consumer.connect();
        return consumer;
      },
      inject: [ConfigService, Kafka],
    },
  ],
  exports: ['KAFKA_PRODUCER', 'KAFKA_CONSUMER', Kafka],
})
export class KafkaModule {}
