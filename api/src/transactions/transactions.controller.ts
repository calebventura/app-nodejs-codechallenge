import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva transacción' })
  @ApiResponse({
    status: 201,
    description: 'Transacción creada correctamente',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const tx: any = await this.service.create(dto);
    return {
      transactionExternalId: tx.transactionExternalId,
      accountExternalIdDebit: tx.accountExternalIdDebit,
      accountExternalIdCredit: tx.accountExternalIdCredit,
      transferTypeId: tx.transferTypeId,
      value: tx.value,
      status: tx.status,
      createdAt: tx.createdAt,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una transacción por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Transacción encontrada',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async findOne(@Param('id') id: string): Promise<TransactionResponseDto> {
    const tx = await this.service.findOne(id);
    return {
      transactionExternalId: tx.transactionExternalId,
      accountExternalIdDebit: tx.accountExternalIdDebit,
      accountExternalIdCredit: tx.accountExternalIdCredit,
      transferTypeId: tx.transferTypeId,
      value: tx.value,
      status: tx.status,
      createdAt: tx.createdAt,
    };
  }
}
