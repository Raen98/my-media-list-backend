import {
	Controller,
	Post,
	Body,
	UseGuards,
	Req,
	Put,
	Delete,
	Param,
	ParseIntPipe,
} from '@nestjs/common';
import { UserItemsService } from './user-items.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from 'src/auth/auth-request.interface';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiParam,
} from '@nestjs/swagger';
import { AddUserItemDto, UpdateUserItemDto } from './dto/user-item.dto';

@ApiTags('User Items') // Categoría en Swagger
@ApiBearerAuth()
@Controller('user-items')
export class UserItemsController {
	constructor(private readonly userItemsService: UserItemsService) {}

	/**
	 *  POST /user-items
	 * Añade un nuevo ítem al perfil del usuario con un estado.
	 */
	@UseGuards(AuthGuard)
	@Post()
	@ApiOperation({ summary: 'Añadir ítem al usuario' })
	@ApiResponse({ status: 201, description: 'Ítem añadido correctamente' })
	@ApiResponse({ status: 409, description: 'Ítem ya existe para el usuario' })
	@ApiResponse({ status: 401, description: 'No autorizado' })
	async addItem(@Body() body: AddUserItemDto, @Req() req: AuthRequest) {
		if (!req.user)
			throw new Error('Token inválido o usuario no autenticado');
		return this.userItemsService.addItemToUser(body, req.user.id);
	}

	/**
	 *  PUT /user-items/:id
	 * Actualiza el estado de un ítem existente por ID.
	 */
	@UseGuards(AuthGuard)
	@Put(':id')
	@ApiOperation({ summary: 'Actualizar estado de ítem' })
	@ApiParam({ name: 'id', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Estado actualizado correctamente',
	})
	@ApiResponse({
		status: 404,
		description: 'Ítem no encontrado o no pertenece al usuario',
	})
	async updateItem(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: UpdateUserItemDto,
		@Req() req: AuthRequest
	) {
		if (!req.user)
			throw new Error('Token inválido o usuario no autenticado');
		return this.userItemsService.updateItemEstado(id, body, req.user.id);
	}

	/**
	 * DELETE /user-items/:id
	 * Elimina un ítem del perfil del usuario por ID.
	 */
	@UseGuards(AuthGuard)
	@Delete(':id')
	@ApiOperation({ summary: 'Eliminar ítem del usuario' })
	@ApiParam({ name: 'id', type: Number })
	@ApiResponse({ status: 200, description: 'Ítem eliminado correctamente' })
	@ApiResponse({
		status: 404,
		description: 'Ítem no encontrado o no pertenece al usuario',
	})
	async deleteItem(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: AuthRequest
	) {
		if (!req.user)
			throw new Error('Token inválido o usuario no autenticado');
		return this.userItemsService.deleteItem(id, req.user.id);
	}
}
