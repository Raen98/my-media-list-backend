import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para añadir un nuevo ítem.
 */
export class AddUserItemDto {
	@ApiProperty({
		example: 'abc123',
		description: 'ID del ítem en la API externa',
	})
	@IsString()
	id_api: string;

	@ApiProperty({
		example: 'P',
		description:
			'Tipo de contenido: P = Película, S = Serie, L = Libro, V = Videojuego',
		enum: ['P', 'S', 'L', 'V'],
	})
	@IsEnum(['P', 'S', 'L', 'V'])
	tipo: 'P' | 'S' | 'L' | 'V';

	@ApiProperty({
		example: 'P',
		description:
			'Estado: P = Pendiente, E = En progreso, C = Completado, A = Abandonado',
		enum: ['P', 'E', 'C', 'A'],
	})
	@IsEnum(['P', 'E', 'C', 'A'])
	estado: 'P' | 'E' | 'C' | 'A';
}

/**
 * DTO para actualizar el estado de un ítem.
 */
export class UpdateUserItemDto {
	@ApiProperty({
		example: 'E',
		description:
			'Nuevo estado: P = Pendiente, E = En progreso, C = Completado, A = Abandonado',
		enum: ['P', 'E', 'C', 'A'],
	})
	@IsEnum(['P', 'E', 'C', 'A'])
	estado: 'P' | 'E' | 'C' | 'A';
}
