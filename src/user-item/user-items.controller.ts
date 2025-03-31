import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UserItemsService } from './user-items.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from 'src/auth/auth-request.interface';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

// 🔹 DTO con validaciones y documentación
export class AddUserItemDto {
	@IsString()
	id_api: string;

	@IsEnum(['P', 'S', 'L', 'V'], {
		message:
			'Tipo debe ser P (película), S (serie), L (libro) o V (videojuego)',
	})
	tipo: 'P' | 'S' | 'L' | 'V';

	@IsEnum(['P', 'E', 'C', 'A'], {
		message:
			'Estado debe ser P (pendiente), E (en progreso), C (completado) o A (abandonado)',
	})
	estado: 'P' | 'E' | 'C' | 'A';
}

@ApiTags('User Items') // Categoría en Swagger
@ApiBearerAuth()
@Controller('user-items')
export class UserItemsController {
	constructor(private readonly userItemsService: UserItemsService) {}

	/**
	 * ✅ POST /user-items
	 * Añade un nuevo ítem al perfil del usuario con un estado.
	 */
	@UseGuards(AuthGuard)
	@Post()
	@ApiOperation({ summary: 'Añadir ítem al usuario' })
	@ApiResponse({ status: 201, description: 'Ítem añadido correctamente' })
	@ApiResponse({ status: 409, description: 'Ítem ya existe para el usuario' })
	@ApiResponse({ status: 401, description: 'No autorizado' })
	async addItem(@Body() body: AddUserItemDto, @Req() req: AuthRequest) {
		if (!req.user) {
			throw new Error('Token inválido o usuario no autenticado');
		}

		return this.userItemsService.addItemToUser(body, req.user.id);
	}
}
