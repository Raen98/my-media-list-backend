// src/auth/dto/change-password.dto.ts
import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
	@ApiProperty({
		example: 'password123',
		description: 'Contraseña actual del usuario',
	})
	@IsString()
	currentPassword: string;

	@ApiProperty({
		example: 'NewPassword123!',
		description:
			'Nueva contraseña (mínimo 8 caracteres, debe incluir una letra mayúscula y un número)',
	})
	@IsString()
	@MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
	@Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
		message:
			'La contraseña debe incluir al menos una letra mayúscula y un número',
	})
	newPassword: string;
}
