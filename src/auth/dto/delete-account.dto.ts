import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
	@ApiProperty({
		example: 'password123',
		description: 'Contraseña del usuario para confirmar la eliminación',
	})
	@IsString()
	password: string;
}
