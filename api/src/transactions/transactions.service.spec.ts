import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Kafka } from 'kafkajs';
import { KAFKA_PRODUCER, REDIS_CLIENT } from '../common/constants';

describe('TransactionsService Units', () => {
  let service: TransactionsService;

  const mockProducer = { send: jest.fn() };
  const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const mockKafka = {};

  const mockPrisma = {
    transaction: {
      create: jest.fn().mockResolvedValue({
        transactionExternalId: 'tx-123',
        accountExternalIdDebit: 'a',
        accountExternalIdCredit: 'b',
        transferTypeId: 1,
        value: 100,
        status: 'pending',
        createdAt: new Date(),
      }),
      findUnique: jest.fn().mockResolvedValue({
        transactionExternalId: 'tx-123',
        accountExternalIdDebit: 'a',
        accountExternalIdCredit: 'b',
        transferTypeId: 1,
        value: 100,
        status: 'pending',
        createdAt: new Date(),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: KAFKA_PRODUCER, useValue: mockProducer },
        { provide: Kafka, useValue: mockKafka },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);

    (service as any).prisma = mockPrisma;
  });

  it('create() debe guardar la tx y publicar en Kafka', async () => {
    const dto: CreateTransactionDto = {
      accountExternalIdDebit: 'a',
      accountExternalIdCredit: 'b',
      transferTypeId: 1,
      value: 100,
    };
    const tx = await service.create(dto);
    expect(tx.transactionExternalId).toBe('tx-123');
    expect(mockProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'transaction_created' }),
    );
  });

  it('findOne() retorna del cache si existe', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({ transactionExternalId: 'tx-123' }),
    );
    const tx = await service.findOne('tx-123');
    expect(tx.transactionExternalId).toBe('tx-123');
    expect(mockPrisma.transaction.findUnique).not.toHaveBeenCalled();
  });

  it('findOne() consulta BD si no hay cache', async () => {
    mockRedis.get.mockResolvedValue(null);
    const tx = await service.findOne('tx-123');
    expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({
      where: { transactionExternalId: 'tx-123' },
    });
    expect(tx.transactionExternalId).toBe('tx-123');
  });
});
