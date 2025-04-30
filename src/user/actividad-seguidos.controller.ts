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
import { UserRepository } from '../repositories/user.repository';
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

interface ActividadSeguidoResponse {
	id: number; // ID del ítem de usuario
	amigo: {
		id: number; // ID del usuario seguido
		nombre: string; // Nombre del usuario
		username: string; // Username del usuario
		avatar: string; // Avatar del usuario
	};
	contenido: {
		id_api: string; // ID de la API externa
		tipo: string; // Tipo de contenido (P, S, L, V)
		titulo: string; // Título del contenido
		imagen: string | null; // URL de la imagen
	};
	fecha: string; // Fecha de creación/actualización
	tiempoTranscurrido: string; // Texto descriptivo del tiempo pasado (ej. "Hace 4 días")
	enComun: number; // Número de contenidos que tenéis en común
}
export interface UserProfile {
	username?: string;
	avatar?: string;
}

@ApiTags('Actividad')
@ApiBearerAuth()
@Controller('actividad-seguidos')
@UseGuards(AuthGuard)
export class ActividadSeguidosController {
	constructor(
		private readonly userItemRepo: UserItemRepository,
		private readonly userRepo: UserRepository,
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService
	) {}

	@Get()
	@ApiOperation({
		summary: 'Obtener actividad reciente de usuarios seguidos',
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
		description: 'Lista de actividad reciente de usuarios seguidos',
	})
	async getActividadSeguidos(
		@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
		@Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
		@Req() req: AuthRequest
	): Promise<ActividadSeguidoResponse[]> {
		if (!req.user) {
			return [];
		}

		const userId = req.user.id;

		const actividadReciente =
			await this.userItemRepo.obtenerActividadSeguidos(
				userId,
				pagina,
				limite
			);

		const actividadProcesada = await Promise.all(
			actividadReciente.map(
				async (actividad: {
					id: number;
					tipo: string;
					id_api: string;
					user_id: number;
					user_name: string;
					updated_at: string;
				}) => {
					let detallesContenido: {
						titulo: string;
						imagen: string | null;
					} = {
						titulo: 'Contenido desconocido',
						imagen: null,
					};

					try {
						// Obtener detalles según el tipo de contenido
						if (actividad.tipo === 'P') {
							detallesContenido =
								await this.tmdbService.buscarPeliculaPorId(
									actividad.id_api
								);
						} else if (actividad.tipo === 'S') {
							detallesContenido =
								await this.tmdbService.buscarSeriePorId({
									id_api: actividad.id_api,
								});
						} else if (actividad.tipo === 'L') {
							detallesContenido =
								(await this.googleBooksService.buscarPorId(
									actividad.id_api
								)) || {
									titulo: 'Título desconocido',
									imagen: null,
								};
						} else if (actividad.tipo === 'V') {
							detallesContenido =
								await this.rawgService.buscarPorId(
									actividad.id_api
								);
						}

						// Obtener información del perfil del amigo
						const perfilAmigo: {
							username?: string;
							avatar?: string;
						} | null = await this.userRepo.findUserProfile(
							actividad.user_id
						);

						// Calcular contenidos en común
						const contenidosEnComun =
							await this.userItemRepo.contarContenidosEnComun(
								userId,
								actividad.user_id
							);

						// Calcular tiempo transcurrido
						const tiempoTranscurrido =
							this.calcularTiempoTranscurrido(
								new Date(actividad.updated_at)
							);

						return {
							id: actividad.id,
							amigo: {
								id: actividad.user_id,
								nombre: actividad.user_name,
								username:
									perfilAmigo?.username ||
									actividad.user_name
										.toLowerCase()
										.replace(/\s+/g, ''),
								avatar: perfilAmigo?.avatar || 'avatar1',
							},
							contenido: {
								id_api: actividad.id_api,
								tipo: actividad.tipo,
								titulo:
									detallesContenido.titulo ||
									`Contenido ${actividad.id_api}`,
								imagen: detallesContenido.imagen,
							},
							fecha: actividad.updated_at,
							tiempoTranscurrido,
							enComun: contenidosEnComun,
						};
					} catch (error) {
						console.error(
							`Error procesando actividad ${actividad.id}:`,
							error
						);

						// Devolver información básica en caso de error
						return {
							id: actividad.id,
							amigo: {
								id: actividad.user_id,
								nombre: actividad.user_name,
								username: actividad.user_name
									.toLowerCase()
									.replace(/\s+/g, ''),
								avatar: 'avatar1',
							},
							contenido: {
								id_api: actividad.id_api,
								tipo: actividad.tipo,
								titulo: `Contenido ${actividad.id_api}`,
								imagen: null,
							},
							fecha: actividad.updated_at,
							tiempoTranscurrido: 'Recientemente',
							enComun: 0,
						};
					}
				}
			)
		);

		return actividadProcesada;
	}

	/**
	 * Calcula una descripción amigable del tiempo transcurrido
	 */
	private calcularTiempoTranscurrido(fecha: Date): string {
		const ahora = new Date();
		const diferenciaMs = ahora.getTime() - fecha.getTime();

		const segundos = Math.floor(diferenciaMs / 1000);
		const minutos = Math.floor(segundos / 60);
		const horas = Math.floor(minutos / 60);
		const dias = Math.floor(horas / 24);
		const semanas = Math.floor(dias / 7);
		const meses = Math.floor(dias / 30);
		const años = Math.floor(dias / 365);

		if (segundos < 60) {
			return 'Hace un momento';
		} else if (minutos < 60) {
			return minutos === 1 ? 'Hace 1 minuto' : `Hace ${minutos} minutos`;
		} else if (horas < 24) {
			return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
		} else if (dias < 7) {
			return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
		} else if (semanas < 4) {
			return semanas === 1 ? 'Hace 1 semana' : `Hace ${semanas} semanas`;
		} else if (meses < 12) {
			return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
		} else {
			return años === 1 ? 'Hace 1 año' : `Hace ${años} años`;
		}
	}
}
