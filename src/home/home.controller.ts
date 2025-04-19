import {
	Controller,
	Get,
	UseGuards,
	Req,
	Query,
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
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';

interface ItemDetailsBase {
	titulo?: string;
	autor?: string;
	genero?: string[];
	imagen?: string | null;
	[key: string]: any;
}

interface PopularItem {
	tipo: string;
	id_api: string;
	count: number;
}

@ApiTags('Home')
@ApiBearerAuth()
@Controller('home')
@UseGuards(AuthGuard)
export class HomeController {
	constructor(
		private readonly userItemRepo: UserItemRepository,
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService
	) {}

	/**
	 * GET /home/trending
	 * Obtiene los elementos más populares entre los amigos del usuario
	 */
	@Get('trending')
	@ApiOperation({ summary: 'Obtener tendencias entre amigos' })
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Número máximo de resultados',
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de elementos populares',
	})
	async getTrending(
		@Req() req: AuthRequest,
		@Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number
	) {
		if (!req.user) {
			return [];
		}

		const userId = req.user.id;

		// Obtener ítems populares entre amigos
		const popularItems: PopularItem[] =
			await this.userItemRepo.obtenerItemsPopularesEntreAmigos(
				userId,
				limit
			);

		// Enriquecer con detalles de las APIs
		const enrichedItems = await Promise.all(
			popularItems.map(async (item) => {
				let itemDetails: ItemDetailsBase = {
					titulo: undefined,
					autor: undefined,
					genero: undefined,
					imagen: undefined,
				};

				try {
					// Obtener detalles según el tipo
					if (item.tipo === 'P') {
						itemDetails =
							await this.tmdbService.buscarPeliculaPorId(
								item.id_api
							);
					} else if (item.tipo === 'S') {
						itemDetails = await this.tmdbService.buscarSeriePorId({
							id_api: item.id_api,
						});
					} else if (item.tipo === 'L') {
						const bookDetails =
							await this.googleBooksService.buscarPorId(
								item.id_api
							);
						if (bookDetails) {
							itemDetails = bookDetails;
						}
					} else if (item.tipo === 'V') {
						itemDetails = await this.rawgService.buscarPorId(
							item.id_api
						);
					}

					return {
						id_api: item.id_api,
						tipo: item.tipo,
						imagen:
							typeof itemDetails.imagen === 'string'
								? itemDetails.imagen
								: null,
						titulo:
							typeof itemDetails.titulo === 'string'
								? itemDetails.titulo
								: `Contenido ${item.id_api}`,
						autor:
							typeof itemDetails.autor === 'string'
								? itemDetails.autor
								: 'Desconocido',
						numAmigos: parseInt(item.count.toString(), 10) || 0,
					};
				} catch (error) {
					console.error(
						`Error al obtener detalles para ítem ${item.id_api}:`,
						error
					);
					// Devolver información básica en caso de error
					return {
						id_api: item.id_api,
						tipo: item.tipo,
						imagen: null,
						titulo: `Contenido ${item.id_api}`,
						autor: 'Desconocido',
						numAmigos: parseInt(item.count.toString(), 10) || 0,
					};
				}
			})
		);

		return enrichedItems;
	}

	/**
	 * GET /home/current
	 * Obtiene el contenido en progreso del usuario
	 */
	@Get('current')
	@ApiOperation({ summary: 'Obtener contenido en progreso' })
	@ApiResponse({
		status: 200,
		description: 'Lista de contenido en progreso',
	})
	async getCurrentContent(@Req() req: AuthRequest) {
		if (!req.user) {
			return [];
		}

		const userId = req.user.id;

		// Obtener ítems en progreso
		const currentItems = await this.userItemRepo.obtenerItemsPorEstado(
			userId,
			'E' // Estado "En progreso"
		);

		// Enriquecer con datos de las APIs
		const enrichedItems = await Promise.all(
			currentItems.map(async (item) => {
				let itemDetails: ItemDetailsBase = {
					titulo: undefined,
					autor: undefined,
					genero: undefined,
					imagen: undefined,
				};

				try {
					// Obtener detalles según el tipo
					if (item.tipo === 'P') {
						itemDetails =
							await this.tmdbService.buscarPeliculaPorId(
								item.id_api
							);
					} else if (item.tipo === 'S') {
						itemDetails = await this.tmdbService.buscarSeriePorId({
							id_api: item.id_api,
						});
					} else if (item.tipo === 'L') {
						const bookDetails =
							await this.googleBooksService.buscarPorId(
								item.id_api
							);
						if (bookDetails) {
							itemDetails = bookDetails;
						}
					} else if (item.tipo === 'V') {
						itemDetails = await this.rawgService.buscarPorId(
							item.id_api
						);
					}

					return {
						id: item.id.toString(),
						id_api: item.id_api,
						titulo:
							itemDetails.titulo ?? `Contenido ${item.id_api}`,
						autor: itemDetails.autor ?? 'Desconocido',
						genero: itemDetails.genero ?? ['Desconocido'],
						imagen: itemDetails.imagen ?? null,
						estado: item.estado,
						tipo: item.tipo,
						ultimaActividad: item.updated_at,
					};
				} catch (error) {
					console.error(
						`Error al obtener detalles para ítem ${item.id_api}:`,
						error
					);
					// Devolver información básica en caso de error
					return {
						id: item.id.toString(),
						id_api: item.id_api,
						titulo: `Contenido ${item.id_api}`,
						autor: 'Desconocido',
						genero: ['Desconocido'],
						imagen: null,
						estado: item.estado,
						tipo: item.tipo,
						ultimaActividad: item.updated_at,
					};
				}
			})
		);

		return enrichedItems;
	}

	/**
	 * GET /home/watchlist
	 * Obtiene el contenido pendiente del usuario
	 */
	@Get('watchlist')
	@ApiOperation({ summary: 'Obtener contenido pendiente' })
	@ApiResponse({
		status: 200,
		description: 'Lista de contenido pendiente',
	})
	async getWatchlist(@Req() req: AuthRequest) {
		if (!req.user) {
			return [];
		}

		const userId = req.user.id;

		// Obtener ítems pendientes
		const pendingItems = await this.userItemRepo.obtenerItemsPorEstado(
			userId,
			'P' // Estado "Pendiente"
		);

		// Enriquecer con datos de las APIs
		const enrichedItems = await Promise.all(
			pendingItems.map(async (item) => {
				let itemDetails: ItemDetailsBase = {
					titulo: undefined,
					autor: undefined,
					genero: undefined,
					imagen: undefined,
				};

				try {
					// Obtener detalles según el tipo
					if (item.tipo === 'P') {
						itemDetails =
							await this.tmdbService.buscarPeliculaPorId(
								item.id_api
							);
					} else if (item.tipo === 'S') {
						itemDetails = await this.tmdbService.buscarSeriePorId({
							id_api: item.id_api,
						});
					} else if (item.tipo === 'L') {
						const bookDetails =
							await this.googleBooksService.buscarPorId(
								item.id_api
							);
						if (bookDetails) {
							itemDetails = bookDetails;
						}
					} else if (item.tipo === 'V') {
						itemDetails = await this.rawgService.buscarPorId(
							item.id_api
						);
					}

					return {
						id: item.id.toString(),
						id_api: item.id_api,
						titulo:
							itemDetails.titulo ?? `Contenido ${item.id_api}`,
						autor: itemDetails.autor ?? 'Desconocido',
						genero: itemDetails.genero ?? ['Desconocido'],
						imagen: itemDetails.imagen ?? null,
						estado: item.estado,
						tipo: item.tipo,
					};
				} catch (error) {
					console.error(
						`Error al obtener detalles para ítem ${item.id_api}:`,
						error
					);
					// Devolver información básica en caso de error
					return {
						id: item.id.toString(),
						id_api: item.id_api,
						titulo: `Contenido ${item.id_api}`,
						autor: 'Desconocido',
						genero: ['Desconocido'],
						imagen: null,
						estado: item.estado,
						tipo: item.tipo,
					};
				}
			})
		);

		return enrichedItems;
	}
}
