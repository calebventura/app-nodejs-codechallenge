import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly kafka: Kafka,
    @Inject('KAFKA_PRODUCER') private readonly producer: Producer,
    @Inject('KAFKA_CONSUMER') private readonly consumer: Consumer,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe({
      topic: 'transaction_created',
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const tx = JSON.parse(message.value!.toString());
        this.logger.log(`Processing transaction: ${JSON.stringify(tx)}`);
        const newStatus = tx.value > 1000 ? 'rejected' : 'approved';

        this.logger.log(
          `Fraud check: ${tx.transactionExternalId} → ${newStatus}`,
        );

        await this.producer.send({
          topic: 'transaction_status_updated',
          messages: [
            {
              key: tx.transactionExternalId,
              value: JSON.stringify({
                transactionExternalId: tx.transactionExternalId,
                status: newStatus,
              }),
            },
          ],
        });
      },
    });
  }
}
