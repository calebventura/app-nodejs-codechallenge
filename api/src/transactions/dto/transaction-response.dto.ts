import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ description: 'UUID de la transacción', format: 'uuid' })
  transactionExternalId: string;

  @ApiProperty({ description: 'UUID de la cuenta debitante', format: 'uuid' })
  accountExternalIdDebit: string;

  @ApiProperty({ description: 'UUID de la cuenta acreedora', format: 'uuid' })
  accountExternalIdCredit: string;

  @ApiProperty({ description: 'ID del tipo de transferencia' })
  transferTypeId: number;

  @ApiProperty({ description: 'Valor de la transacción' })
  value: number;

  @ApiProperty({
    description: 'Estado final de la transacción',
    enum: ['pending', 'approved', 'rejected'],
  })
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Fecha de creación',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}
