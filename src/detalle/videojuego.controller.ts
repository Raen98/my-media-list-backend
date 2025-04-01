import {
	Controller,
	Get,
	Query,
	Req,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import { RawgService } from '../apis/rawg.api';
import { UserItemRepository } from '../repositories/user-item.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Videojuegos') // 📂 Categoría en Swagger
@ApiBearerAuth() // 🔐 Requiere token JWT
@Controller('videojuego')
@UseGuards(AuthGuard)
export class VideojuegoController {
	constructor(
		private readonly rawgService: RawgService,
		private readonly userItemRepo: UserItemRepository
	) {}

	/**
	 * GET /videojuego?id_api=...
	 * Devuelve todos los detalles del videojuego con ese id en RAWG,
	 * el estado del usuario (si lo tiene) y qué amigos también lo tienen.
	 */
	@Get()
	@ApiOperation({
		summary: 'Obtener detalles de un videojuego por su id_api',
	})
	@ApiQuery({
		name: 'id_api',
		required: true,
		description: 'ID del videojuego en RAWG',
	})
	@ApiResponse({
		status: 200,
		description: 'Detalles del videojuego, estado del usuario y amigos',
	})
	@ApiResponse({ status: 404, description: 'Videojuego no encontrado' })
	async getVideojuego(
		@Query('id_api') id_api: string,
		@Req() req: AuthRequest
	) {
		const user = req.user;
		if (!user) throw new Error('Usuario no autenticado');

		// Obtenemos el detalle del juego desde RAWG
		const juego = await this.rawgService.buscarPorId(id_api);
		if (!juego) throw new NotFoundException('Videojuego no encontrado');

		// Buscamos si el usuario ya lo tiene guardado
		const userItem = await this.userItemRepo.findOne({
			where: { user: { id: user.id }, id_api, tipo: 'V' },
		});

		// Obtenemos los amigos que también lo tienen
		const amigos = await this.userItemRepo.obtenerAmigosConItem(
			user.id,
			id_api,
			'V'
		);

		return [
			{
				...juego,
				item: userItem
					? { id: userItem.id, estado: userItem.estado }
					: null,
				amigos: amigos.map((a) => ({
					id: a.id,
					estado: a.estado,
					imagen_id: a.imagen_id,
				})),
			},
		];
	}
}
