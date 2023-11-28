import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'UUID de la cuenta debitante',
    example: '17e58fd6-f567-4990-93c4-0f862d123002',
  })
  @IsUUID()
  @IsNotEmpty()
  accountExternalIdDebit: string;

  @ApiProperty({
    description: 'UUID de la cuenta acreedora',
    format: 'uuid',
    example: '8b84ca5b-1193-48af-8aaa-49a331473966',
  })
  @IsUUID()
  @IsNotEmpty()
  accountExternalIdCredit: string;

  @ApiProperty({ description: 'ID del tipo de transferencia', example: 1 })
  @IsNumber()
  transferTypeId: number;

  @ApiProperty({
    description: 'Valor de la transacción (>= 0)',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  value: number;
}
