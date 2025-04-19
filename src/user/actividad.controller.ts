import {
	Controller,
	Get,
	Param,
	Query,
	UseGuards,
	Req,
	DefaultValuePipe,
	ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { UserItemRepository } from '../repositories/user-item.repository';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from '../apis/rawg.api';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Actividad')
@ApiBearerAuth()
@Controller('actividad')
@UseGuards(AuthGuard)
export class ActividadController {
	constructor(
		private readonly userItemRepo: UserItemRepository,
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService
	) {}

	/**
	 * GET /actividad
	 * Obtiene la actividad del usuario autenticado y sus amigos.
	 */
	@Get()
	@ApiOperation({ summary: 'Obtener actividad propia y de amigos' })
	@ApiQuery({
		name: 'pagina',
		required: false,
		description: 'Número de página',
		type: Number,
	})
	@ApiQuery({
		name: 'limite',
		required: false,
		description: 'Elementos por página',
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: 'Feed de actividad propia y de amigos',
	})
	async getActividadPropia(
		@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
		@Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
		@Req() req: AuthRequest
	) {
		return this.getActividad(null, pagina, limite, req);
	}

	/**
	 * GET /actividad/:id
	 * Obtiene la actividad de un usuario específico.
	 */
	@Get(':id')
	@ApiOperation({ summary: 'Obtener actividad de un usuario específico' })
	@ApiParam({
		name: 'id',
		required: true,
		description: 'ID del usuario',
	})
	@ApiQuery({
		name: 'pagina',
		required: false,
		description: 'Número de página',
		type: Number,
	})
	@ApiQuery({
		name: 'limite',
		required: false,
		description: 'Elementos por página',
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: 'Feed de actividad del usuario',
	})
	async getActividadById(
		@Param('id') id: string,
		@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
		@Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
		@Req() req: AuthRequest
	) {
		return this.getActividad(id, pagina, limite, req);
	}

	/**
	 * Método interno compartido para obtener actividad
	 */
	private async getActividad(
		id: string | null,
		pagina: number,
		limite: number,
		req: AuthRequest
	) {
		if (!req.user) {
			return [];
		}

		// Si se proporciona un ID, obtener actividad solo de ese usuario
		// Si no, obtener actividad del usuario actual y sus amigos
		const userId = id ? parseInt(id) : req.user.id;
		const includeFromFriends = !id; // Solo incluir amigos si no se especifica un ID

		// Obtener los cambios de estado recientes
		const activityItems = await this.userItemRepo.obtenerActividadUsuario(
			userId,
			includeFromFriends,
			pagina,
			limite
		);

		// Enriquecer cada ítem con datos detallados de las APIs externas
		interface ActivityItem {
			id: number;
			user_id: number;
			user_name: string;
			avatar_id?: string;
			id_api: string;
			tipo: 'P' | 'S' | 'L' | 'V';
			estado: 'C' | 'E' | 'A';
			updated_at: string;
		}

		const enrichedActivity = await Promise.all(
			activityItems.map(async (item: ActivityItem) => {
				interface ContentDetails {
					titulo?: string;
					imagen?: string | null | undefined;
				}
				let contentDetails: ContentDetails = {};

				try {
					// Obtener detalles según el tipo de contenido
					if (item.tipo === 'P') {
						contentDetails =
							await this.tmdbService.buscarPeliculaPorId(
								item.id_api
							);
					} else if (item.tipo === 'S') {
						contentDetails =
							await this.tmdbService.buscarSeriePorId({
								id_api: item.id_api,
							});
					} else if (item.tipo === 'L') {
						contentDetails =
							(await this.googleBooksService.buscarPorId(
								item.id_api
							)) || {};
					} else if (item.tipo === 'V') {
						contentDetails = await this.rawgService.buscarPorId(
							item.id_api
						);
					}

					// Determinar tipo de acción basado en el estado
					let actionType = 'added';
					if (item.estado === 'C') actionType = 'finished';
					else if (item.estado === 'E') actionType = 'started';
					else if (item.estado === 'A') actionType = 'dropped';

					return {
						id: item.id,
						userId: item.user_id,
						contentTitle:
							contentDetails?.titulo ??
							`Contenido ${item.id_api}`,
						contentId: item.id,
						contentApiId: item.id_api,
						contentType: item.tipo,
						contentImage: contentDetails.imagen || null,
						actionType,
						timestamp: item.updated_at,
						status: item.estado,
					};
				} catch (error) {
					console.error(
						`Error al obtener detalles para actividad ${item.id}:`,
						error
					);
					// Devolver información básica en caso de error
					return {
						id: item.id,
						userId: item.user_id,
						userName: item.user_name,
						userAvatar: item.avatar_id || 'avatar1',
						contentId: item.id,
						contentApiId: item.id_api,
						contentTitle: `Contenido ${item.id_api}`,
						contentType: item.tipo,
						contentImage: null,
						actionType: 'added',
						timestamp: item.updated_at,
						status: item.estado,
					};
				}
			})
		);

		return enrichedActivity;
	}
}
