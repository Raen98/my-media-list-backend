// src/auth/dto/register.dto.ts
import {
	IsEmail,
	IsString,
	MinLength,
	Matches,
	IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
	@ApiProperty({
		example: 'usuario123',
		description: 'Nombre de usuario único',
	})
	@IsString()
	@MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
	username: string;

	@ApiProperty({
		example: 'Nombre Completo',
		description: 'Nombre completo o de visualización',
	})
	@IsString()
	name: string;

	@ApiProperty({
		example: 'ejemplo@email.com',
		description: 'Correo electrónico del usuario',
	})
	@IsEmail({}, { message: 'Debe proporcionar un email válido' })
	email: string;

	@ApiProperty({
		example: 'Password123!',
		description:
			'Contraseña (mín. 8 caracteres, incluir mayúscula y número)',
	})
	@IsString()
	@MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
	@Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
		message:
			'La contraseña debe incluir al menos una letra mayúscula y un número',
	})
	password: string;

	@ApiProperty({
		example: 'Me gusta el cine y los videojuegos...',
		description: 'Biografía o descripción del usuario',
		required: false,
	})
	@IsOptional()
	@IsString()
	bio?: string;

	@ApiProperty({
		example: 'avatar3',
		description: 'ID del avatar seleccionado',
		required: false,
		default: 'avatar1',
	})
	@IsOptional()
	@IsString()
	avatar_id?: string;
}
