import {
	Controller,
	Get,
	Query,
	Req,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { UserItemRepository } from '../repositories/user-item.repository';
import { TmdbService } from '../apis/tmdb.api';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Películas')
@ApiBearerAuth()
@Controller('pelicula')
@UseGuards(AuthGuard)
export class PeliculaController {
	constructor(
		private readonly tmdbService: TmdbService,
		private readonly userItemRepo: UserItemRepository
	) {}

	/**
	 * GET /pelicula?id_api=...
	 * Devuelve los detalles de una película de TMDB + estado del usuario y amigos que la tienen.
	 */
	@Get()
	@ApiOperation({ summary: 'Obtener detalles de una película por su id_api' })
	@ApiQuery({
		name: 'id_api',
		required: true,
		description: 'ID de la película en TMDB',
	})
	@ApiResponse({
		status: 200,
		description:
			'Detalles de la película, item del usuario y amigos que la tienen',
	})
	@ApiResponse({ status: 404, description: 'Película no encontrada' })
	async getPelicula(
		@Query('id_api') id_api: string,
		@Req() req: AuthRequest
	) {
		const user = req.user;
		if (!user) throw new Error('Usuario no autenticado');

		// Obtenemos la info de TMDB
		const pelicula = await this.tmdbService.buscarPeliculaPorId(id_api);
		if (!pelicula) throw new NotFoundException('Película no encontrada');

		// Comprobamos si el usuario la tiene en su lista
		const userItem = await this.userItemRepo.findOne({
			where: { user: { id: user.id }, id_api, tipo: 'P' },
		});

		// Obtenemos los amigos que también la tienen
		const amigos = await this.userItemRepo.obtenerAmigosConItem(
			user.id,
			id_api,
			'P'
		);

		return {
			...pelicula,
			item: userItem
				? { id: userItem.id, estado: userItem.estado }
				: null,
			amigos: amigos.map((a) => ({
				id: a.id,
				estado: a.estado,
				imagen_id: a.imagen_id,
			})),
		};
	}
}
