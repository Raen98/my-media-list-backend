import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from 'src/apis/rawg.api';
import { UserItemRepository } from 'src/repositories/user-item.repository';

// Definición de la estructura de los resultados de búsqueda
export interface ResultadoBusqueda {
	item?: { id: number; estado: string } | null;
	id_api: string;
	tipo: string;
	imagen: string | null;
	titulo: string;
	descripcion: string;
	fechaLanzamiento: string;
	genero: string[];
	numAmigos?: number;
}

// Interfaz para representar los datos del usuario autenticado
interface JwtPayload {
	id: number;
	email: string;
}

@Injectable()
export class SearchService {
	constructor(
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService,
		private readonly userItemRepository: UserItemRepository
	) {}

	// Método principal para realizar la búsqueda en las APIs externas
	async buscar(
		params: SearchDto,
		user: JwtPayload
	): Promise<ResultadoBusqueda[]> {
		const { busqueda, tipo } = params;
		console.log(`Usuario autenticado: ${user.email}`);
		console.log(`Buscando "${busqueda}" en la categoría "${tipo}"`);

		let resultados: ResultadoBusqueda[] = [];

		try {
			// Buscar en la API correspondiente
			if (tipo === 'P' || tipo === 'S') {
				resultados = await this.tmdbService.buscar(busqueda, tipo);
			} else if (tipo === 'L') {
				resultados = await this.googleBooksService.buscar(busqueda);
			} else if (tipo === 'V') {
				resultados = await this.rawgService.buscar(busqueda);
			}

			// Filtrar los que no tienen imagen
			resultados = resultados.filter((item) => item.imagen !== null);

			// Obtener todos los ítems del usuario del tipo actual
			const userItems = await this.userItemRepository.find({
				where: { user: { id: user.id }, tipo },
			});

			// Crear un Map para acceso rápido por id_api
			const itemsMap = new Map<string, { id: number; estado: string }>();
			userItems.forEach((item) => {
				itemsMap.set(item.id_api, { id: item.id, estado: item.estado });
			});

			// Añadir numAmigos e info del item del usuario (si lo tiene)
			await Promise.all(
				resultados.map(async (item) => {
					// Añadir el número de amigos que lo tienen
					try {
						const count =
							await this.userItemRepository.contarUsuariosConItem(
								item.id_api,
								item.tipo,
								user.id
							);
						item.numAmigos = count ?? 0;
					} catch (repoError) {
						console.error(
							`Error al contar amigos para ${item.id_api}:`,
							repoError instanceof Error
								? repoError.message
								: 'Error desconocido'
						);
						item.numAmigos = 0;
					}

					// Añadir información del ítem del usuario (si existe)
					item.item = itemsMap.get(item.id_api) || null;
				})
			);

			return resultados;
		} catch (error) {
			console.error(
				'Error en búsqueda:',
				error instanceof Error ? error.message : 'Error desconocido'
			);
			return [];
		}
	}
}
