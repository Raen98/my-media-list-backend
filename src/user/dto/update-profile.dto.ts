// src/user/dto/update-profile.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
	@ApiProperty({
		example: 'Nuevo Nombre',
		description: 'Nombre completo o de visualización',
		required: false,
	})
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({
		example: 'Soy un desarrollador...',
		description: 'Biografía o descripción del usuario',
		required: false,
	})
	@IsOptional()
	@IsString()
	bio?: string;

	@ApiProperty({
		example: 'avatar2',
		description: 'ID del avatar seleccionado',
		required: false,
	})
	@IsOptional()
	@IsString()
	avatar_id?: string;
}
