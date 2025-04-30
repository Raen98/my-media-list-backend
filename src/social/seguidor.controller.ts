// src/social/seguidor.controller.ts
import {
	Controller,
	Get,
	Param,
	UseGuards,
	Req,
	ParseIntPipe,
	NotFoundException,
	Query,
	DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from '../apis/rawg.api';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiQuery,
} from '@nestjs/swagger';

interface SeguidorResponse {
	id: number;
	nombre: string;
	username: string;
	avatar: string;
	ultimaActividad: {
		tipo: string;
		titulo: string;
		fecha: string;
		estado: string;
	} | null;
	contenidosTotales: number;
	contenidosCompartidos: number;
}

@ApiTags('Seguidores')
@ApiBearerAuth()
@Controller('social')
@UseGuards(AuthGuard)
export class SeguidorController {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly userItemRepository: UserItemRepository,
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService
	) {}

	/**
	 * GET /social/seguidores/:userId?pagina=1&limite=10
	 * Obtiene la lista de seguidores de un usuario con detalles enriquecidos
	 */
	@Get('seguidores/:userId')
	@ApiOperation({ summary: 'Obtener lista de seguidores de un usuario' })
	@ApiParam({
		name: 'userId',
		required: true,
		description: 'ID del usuario cuyos seguidores se quieren listar',
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
		description: 'Lista de seguidores con detalles',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async getSeguidores(
		@Param('userId', ParseIntPipe) userId: number,
		@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
		@Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
		@Req() req: AuthRequest
	): Promise<SeguidorResponse[]> {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		// Verificar que el usuario existe
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		// Obtener lista de seguidores
		const seguidores = await this.userRepository.getFollowers(
			userId,
			pagina,
			limite
		);

		// Enriquecer la respuesta con datos adicionales
		const respuesta: SeguidorResponse[] = await Promise.all(
			seguidores.map(async (seguidor) => {
				// Obtener última actividad
				const ultimaActividad =
					await this.userRepository.getLastActivity(seguidor.id);

				// Variable para el título real de la última actividad
				let tituloRealActividad = 'Sin título';

				// Si existe una última actividad, intentar obtener el título real
				if (ultimaActividad) {
					try {
						if (ultimaActividad.tipo === 'P') {
							// Película
							const pelicula =
								await this.tmdbService.buscarPeliculaPorId(
									ultimaActividad.id_api
								);
							tituloRealActividad =
								pelicula?.titulo || 'Sin título';
						} else if (ultimaActividad.tipo === 'S') {
							// Serie
							const serie =
								await this.tmdbService.buscarSeriePorId({
									id_api: ultimaActividad.id_api,
								});
							tituloRealActividad = serie?.titulo || 'Sin título';
						} else if (ultimaActividad.tipo === 'L') {
							// Libro
							const libro =
								await this.googleBooksService.buscarPorId(
									ultimaActividad.id_api
								);
							tituloRealActividad = libro?.titulo || 'Sin título';
						} else if (ultimaActividad.tipo === 'V') {
							// Videojuego
							const juego = await this.rawgService.buscarPorId(
								ultimaActividad.id_api
							);
							tituloRealActividad = juego?.titulo || 'Sin título';
						}
					} catch (error) {
						console.error(
							`Error al obtener título para item ${ultimaActividad.id_api}:`,
							error
						);
						tituloRealActividad = 'Sin título';
					}
				}

				// Contar contenidos totales
				const contenidosTotales = await this.userItemRepository.count({
					where: { user: { id: seguidor.id } },
				});

				// Contar contenidos compartidos (en común)
				const contenidosCompartidos =
					await this.userItemRepository.contarContenidosEnComun(
						userId,
						seguidor.id
					);

				return {
					id: seguidor.id,
					nombre: seguidor.name,
					username: seguidor.username || 'usuario_desconocido', // Usar un valor predeterminado si el username es undefined
					avatar: seguidor.avatar_id || 'avatar1', // Solo usar 'avatar1' si no hay avatar_id
					ultimaActividad: ultimaActividad
						? {
								tipo: ultimaActividad.tipo,
								titulo: tituloRealActividad,
								fecha: ultimaActividad.updated_at,
								estado: ultimaActividad.estado,
							}
						: null,
					contenidosTotales,
					contenidosCompartidos,
				};
			})
		);

		return respuesta;
	}

	/**
	 * GET /social/seguidos/:userId?pagina=1&limite=10
	 * Obtiene la lista de usuarios seguidos por un usuario con detalles enriquecidos
	 */
	@Get('seguidos/:userId')
	@ApiOperation({ summary: 'Obtener lista de usuarios seguidos' })
	@ApiParam({
		name: 'userId',
		required: true,
		description: 'ID del usuario cuyos seguidos se quieren listar',
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
		description: 'Lista de usuarios seguidos con detalles',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async getSeguidos(
		@Param('userId', ParseIntPipe) userId: number,
		@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
		@Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
		@Req() req: AuthRequest
	): Promise<SeguidorResponse[]> {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		// Verificar que el usuario existe
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		// Obtener lista de seguidos
		const seguidos = await this.userRepository.getFollowing(
			userId,
			pagina,
			limite
		);

		// Enriquecer la respuesta con datos adicionales
		const respuesta: SeguidorResponse[] = await Promise.all(
			seguidos.map(async (seguido) => {
				// Obtener última actividad
				const ultimaActividad =
					await this.userRepository.getLastActivity(seguido.id);

				// Variable para el título real de la última actividad
				let tituloRealActividad = 'Sin título';

				// Si existe una última actividad, intentar obtener el título real
				if (ultimaActividad) {
					try {
						if (ultimaActividad.tipo === 'P') {
							// Película
							const pelicula =
								await this.tmdbService.buscarPeliculaPorId(
									ultimaActividad.id_api
								);
							tituloRealActividad =
								pelicula?.titulo || 'Sin título';
						} else if (ultimaActividad.tipo === 'S') {
							// Serie
							const serie =
								await this.tmdbService.buscarSeriePorId({
									id_api: ultimaActividad.id_api,
								});
							tituloRealActividad = serie?.titulo || 'Sin título';
						} else if (ultimaActividad.tipo === 'L') {
							// Libro
							const libro =
								await this.googleBooksService.buscarPorId(
									ultimaActividad.id_api
								);
							tituloRealActividad = libro?.titulo || 'Sin título';
						} else if (ultimaActividad.tipo === 'V') {
							// Videojuego
							const juego = await this.rawgService.buscarPorId(
								ultimaActividad.id_api
							);
							tituloRealActividad = juego?.titulo || 'Sin título';
						}
					} catch (error) {
						console.error(
							`Error al obtener título para item ${ultimaActividad.id_api}:`,
							error
						);
						tituloRealActividad = 'Sin título';
					}
				}

				// Contar contenidos totales
				const contenidosTotales = await this.userItemRepository.count({
					where: { user: { id: seguido.id } },
				});

				// Contar contenidos compartidos (en común)
				const contenidosCompartidos =
					await this.userItemRepository.contarContenidosEnComun(
						userId,
						seguido.id
					);

				return {
					id: seguido.id,
					nombre: seguido.name,
					username: seguido.username || 'usuario_desconocido', // Usar un valor predeterminado si el username es undefined
					avatar: seguido.avatar_id || 'avatar1', // Solo usar 'avatar1' si no hay avatar_id
					ultimaActividad: ultimaActividad
						? {
								tipo: ultimaActividad.tipo,
								titulo: tituloRealActividad,
								fecha: ultimaActividad.updated_at,
								estado: ultimaActividad.estado,
							}
						: null,
					contenidosTotales,
					contenidosCompartidos,
				};
			})
		);

		return respuesta;
	}
}
