import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsController Units', () => {
  let controller: TransactionsController;
  const mockService = {
    create: jest.fn().mockResolvedValue({
      transactionExternalId: 'tx-321',
      accountExternalIdDebit: 'a',
      accountExternalIdCredit: 'b',
      transferTypeId: 1,
      value: 50,
      status: 'pending',
      createdAt: new Date(),
    }),
    findOne: jest.fn().mockResolvedValue({
      transactionExternalId: 'tx-321',
      accountExternalIdDebit: 'a',
      accountExternalIdCredit: 'b',
      transferTypeId: 1,
      value: 50,
      status: 'approved',
      createdAt: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockService }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('POST create() devuelve DTO con status pending', async () => {
    const dto: CreateTransactionDto = {
      accountExternalIdDebit: 'a',
      accountExternalIdCredit: 'b',
      transferTypeId: 1,
      value: 50,
    };
    const res = await controller.create(dto);
    expect(res.transactionExternalId).toBe('tx-321');
    expect(res.status).toBe('pending');
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('GET findOne() devuelve DTO con status approved', async () => {
    const res = await controller.findOne('tx-321');
    expect(res.status).toBe('approved');
    expect(mockService.findOne).toHaveBeenCalledWith('tx-321');
  });
});
