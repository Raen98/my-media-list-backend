import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UserItemsService } from './user-items.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiBody,
} from '@nestjs/swagger';

// DTO para actualizar el estado
class UpdateEstadoDto {
	id_api: string;
	tipo: 'P' | 'S' | 'L' | 'V';
	estado: 'P' | 'E' | 'C' | 'A';
}

@ApiTags('Estado')
@ApiBearerAuth()
@Controller('estado')
export class EstadoController {
	constructor(private readonly userItemsService: UserItemsService) {}

	/**
	 * POST /estado
	 * Actualiza o crea un estado para un ítem de usuario
	 * Si no existe, lo crea. Si existe, actualiza su estado.
	 */
	@UseGuards(AuthGuard)
	@Post()
	@ApiOperation({ summary: 'Actualizar estado de un ítem' })
	@ApiBody({ type: UpdateEstadoDto })
	@ApiResponse({
		status: 201,
		description: 'Estado actualizado correctamente',
	})
	@ApiResponse({ status: 401, description: 'No autorizado' })
	async updateEstado(@Body() body: UpdateEstadoDto, @Req() req: AuthRequest) {
		if (!req.user)
			throw new Error('Token inválido o usuario no autenticado');

		// Verificar si el ítem ya existe para el usuario
		const existingItem = await this.userItemsService.findExistingItem(
			body.id_api,
			body.tipo,
			req.user.id
		);

		if (existingItem) {
			// Si existe, actualizar su estado
			return this.userItemsService.updateItemEstado(
				existingItem.id,
				{ estado: body.estado },
				req.user.id
			);
		} else {
			// Si no existe, crear uno nuevo
			return this.userItemsService.addItemToUser(
				{
					id_api: body.id_api,
					tipo: body.tipo,
					estado: body.estado,
				},
				req.user.id
			);
		}
	}
}
