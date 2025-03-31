import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from 'src/apis/rawg.api';
import { UserItemRepository } from 'src/repositories/user-item.repository';

// Definición de la estructura de los resultados de búsqueda
export interface ResultadoBusqueda {
	id_api: string;
	tipo: string;
	imagen: string | null;
	titulo: string;
	descripcion: string;
	fechaLanzamiento: string;
	genero: string[];
	numAmigos?: number; // Número de amigos que tienen este ítem
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
			// Seleccionar la API correspondiente según el tipo de contenido
			if (tipo === 'P' || tipo === 'S') {
				resultados = await this.tmdbService.buscar(busqueda, tipo);
			} else if (tipo === 'L') {
				resultados = await this.googleBooksService.buscar(busqueda);
			} else if (tipo === 'V') {
				resultados = await this.rawgService.buscar(busqueda);
			}

			// Filtrar los resultados que no tienen imagen para mejorar la calidad de la búsqueda
			resultados = resultados.filter((item) => item.imagen !== null);

			// Para cada resultado, contar cuántos amigos tienen el ítem registrado
			await Promise.all(
				resultados.map(async (item) => {
					try {
						const count =
							await this.userItemRepository.contarUsuariosConItem(
								item.id_api,
								item.tipo,
								user.id
							);
						// Si la consulta devuelve undefined, asignar 0 por defecto
						item.numAmigos = count ?? 0;
					} catch (repoError) {
						console.error(
							`Error al contar amigos para ${item.id_api}:`,
							repoError instanceof Error
								? repoError.message
								: 'Error desconocido'
						);
						// En caso de error, asignar 0 para evitar problemas
						item.numAmigos = 0;
					}
				})
			);

			return resultados;
		} catch (error) {
			// Manejo seguro de errores
			console.error(
				'Error en búsqueda:',
				error instanceof Error ? error.message : 'Error desconocido'
			);
			return [];
		}
	}
}
