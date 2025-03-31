import { IsEnum, IsString } from 'class-validator';

/**
 * DTO para añadir un nuevo ítem.
 */
export class AddUserItemDto {
	@IsString()
	id_api: string;

	@IsEnum(['P', 'S', 'L', 'V'])
	tipo: 'P' | 'S' | 'L' | 'V';

	@IsEnum(['P', 'E', 'C', 'A'])
	estado: 'P' | 'E' | 'C' | 'A';
}

/**
 * DTO para actualizar el estado de un ítem.
 */
export class UpdateUserItemDto {
	@IsEnum(['P', 'E', 'C', 'A'])
	estado: 'P' | 'E' | 'C' | 'A';
}
