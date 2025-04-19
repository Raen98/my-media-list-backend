import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ActionType {
	STARTED = 'started',
	FINISHED = 'finished',
	ADDED = 'added',
	DROPPED = 'dropped',
	RATED = 'rated',
}

export class ActivityDto {
	@ApiProperty({
		example: 'started',
		description: 'Tipo de acción: started, finished, added, dropped, rated',
		enum: ActionType,
	})
	@IsEnum(ActionType)
	actionType: ActionType;

	@ApiProperty({
		example: 'abc123',
		description: 'ID del ítem en la API externa',
	})
	@IsString()
	contentId: string;

	@ApiProperty({
		example: 'P',
		description:
			'Tipo de contenido: P=Película, S=Serie, L=Libro, V=Videojuego',
		enum: ['P', 'S', 'L', 'V'],
	})
	@IsEnum(['P', 'S', 'L', 'V'])
	contentType: 'P' | 'S' | 'L' | 'V';

	@ApiProperty({
		example: 'Película de ejemplo',
		description: 'Título del contenido',
	})
	@IsString()
	contentTitle: string;

	@ApiProperty({
		example: 'https://example.com/image.jpg',
		description: 'URL de la imagen del contenido',
		required: false,
	})
	@IsOptional()
	@IsString()
	contentImage?: string;

	@ApiProperty({
		example: '2023-06-15T10:30:00Z',
		description: 'Fecha y hora de la acción',
	})
	@IsString()
	timestamp: string;

	@ApiProperty({
		example: 'C',
		description:
			'Estado: P=Pendiente, E=En progreso, C=Completado, A=Abandonado',
		enum: ['P', 'E', 'C', 'A'],
		required: false,
	})
	@IsOptional()
	@IsEnum(['P', 'E', 'C', 'A'])
	status?: 'P' | 'E' | 'C' | 'A';
}
