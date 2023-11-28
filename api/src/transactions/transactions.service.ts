import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Producer, Kafka } from 'kafkajs';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { KAFKA_PRODUCER, REDIS_CLIENT } from '../common/constants';

@Injectable()
export class TransactionsService implements OnModuleInit {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
    @Inject(Kafka) private readonly kafka: Kafka,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}
  async onModuleInit() {
    const consumer = this.kafka.consumer({
      groupId: 'transaction-service-group',
    });
    await consumer.connect();
    await consumer.subscribe({
      topic: 'transaction_status_updated',
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const { transactionExternalId, status } = JSON.parse(
          message.value!.toString(),
        );
        this.logger.log(
          `Recibido evento status_updated → ${transactionExternalId}: ${status}`,
        );

        await this.prisma.transaction.update({
          where: { transactionExternalId },
          data: { status },
        });

        await this.redisClient.del(transactionExternalId);

        this.logger.log(
          `Transacción ${transactionExternalId} actualizada a ${status}`,
        );
      },
    });
  }
  async create(dto: CreateTransactionDto) {
    const tx = await this.prisma.transaction.create({
      data: {
        accountExternalIdDebit: dto.accountExternalIdDebit,
        accountExternalIdCredit: dto.accountExternalIdCredit,
        transferTypeId: dto.transferTypeId,
        value: dto.value,
      },
    });

    await this.producer.send({
      topic: 'transaction_created',
      messages: [
        {
          key: tx.transactionExternalId,
          value: JSON.stringify({
            transactionExternalId: tx.transactionExternalId,
            accountExternalIdDebit: tx.accountExternalIdDebit,
            accountExternalIdCredit: tx.accountExternalIdCredit,
            transferTypeId: tx.transferTypeId,
            value: tx.value,
            createdAt: tx.createdAt,
          }),
        },
      ],
    });

    return tx;
  }

  async findOne(transactionExternalId: string) {
    const cache = await this.redisClient.get(transactionExternalId);
    if (cache) {
      return JSON.parse(cache);
    }

    const tx = await this.prisma.transaction.findUnique({
      where: { transactionExternalId },
    });
    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    await this.redisClient.set(
      transactionExternalId,
      JSON.stringify(tx),
      'EX',
      60,
    );

    return tx;
  }
}
