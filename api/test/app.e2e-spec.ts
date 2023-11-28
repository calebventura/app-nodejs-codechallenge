import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { KafkaMock } from './kafka.mock';
import { Kafka } from 'kafkajs';
import { TransactionsService } from '../src/transactions/transactions.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../src/common/constants';

describe('Transactions E2E Flow', () => {
  let app: INestApplication;
  let transactionId: string;

  beforeAll(async () => {
    KafkaMock.messages = [];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Kafka)
      .useClass(KafkaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('1) POST /transactions crea con status pending', async () => {
    const res = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        accountExternalIdDebit: '05acb43f-9952-4b4c-9fcc-4ac5c8eb17c4',
        accountExternalIdCredit: '17e58fd6-f567-4990-93c4-0f862d123002',
        transferTypeId: 1,
        value: 500,
      })
      .expect(201);

    expect(res.body).toHaveProperty('transactionExternalId');
    expect(res.body.status).toBe('pending');
    transactionId = res.body.transactionExternalId;

    const produced = KafkaMock.messages.find(
      (m) => m.topic === 'transaction_created',
    );
    expect(produced).toBeDefined();
    expect(produced!.messages[0].key).toBe(transactionId);
  });

  it('2) Simular evento transaction_status_updated y procesar update', async () => {
    const payload = {
      transactionExternalId: transactionId,
      status: 'approved',
    };

    await KafkaMock.eachMessage({
      message: { value: Buffer.from(JSON.stringify(payload)) },
    });

    await new Promise((r) => setTimeout(r, 100));
  });

  it('3) GET /transactions/:id debe devolver status approved', async () => {
    await request(app.getHttpServer())
      .get(`/transactions/${transactionId}`)
      .expect(200)
      .then((res) => {
        expect(res.body.transactionExternalId).toBe(transactionId);
        expect(res.body.status).toBe('approved');
      });
  });

  afterAll(async () => {
    const txService = app.get<TransactionsService>(TransactionsService);
    await txService['prisma'].$disconnect();

    const redisClient = app.get<Redis>(REDIS_CLIENT);
    await redisClient.quit();

    await app.close();
  });
});
