import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from 'src/apis/rawg.api';
import { UserItemRepository } from 'src/repositories/user-item.repository';

// Resultado enriquecido de búsqueda para enviar al frontend
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

// Payload del usuario autenticado (viene del JWT)
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

	/**
	 * Realiza una búsqueda en APIs externas según el tipo (P, S, L, V).
	 * Devuelve los resultados enriquecidos con estado del usuario y nº de amigos.
	 */
	async buscar(
		params: SearchDto,
		user: JwtPayload
	): Promise<ResultadoBusqueda[]> {
		const { busqueda, tipo } = params;
		console.log(
			` Usuario ${user.email} buscando "${busqueda}" en "${tipo}"`
		);

		let resultados: ResultadoBusqueda[] = [];

		try {
			// Llamar a la API correspondiente
			if (tipo === 'P' || tipo === 'S') {
				resultados = await this.tmdbService.buscar(busqueda, tipo);
			} else if (tipo === 'L') {
				resultados = await this.googleBooksService.buscar(busqueda);
			} else if (tipo === 'V') {
				resultados = await this.rawgService.buscar(busqueda);
			}

			// Filtrar los que no tengan imagen
			resultados = resultados.filter((item) => item.imagen !== null);

			// Obtener los ítems guardados por el usuario de ese tipo.
			const userItems = await this.userItemRepository.find({
				where: {
					user: { id: user.id },
					tipo: tipo as 'P' | 'S' | 'L' | 'V',
				},
			});

			// Crear un Map de acceso rápido por id_api
			const itemsMap = new Map<string, { id: number; estado: string }>();
			userItems.forEach((item) => {
				const key = String(item.id_api).trim();
				itemsMap.set(key, { id: item.id, estado: item.estado });
			});

			// Añadir info extra (estado del usuario y nº de amigos)
			await Promise.all(
				resultados.map(async (item) => {
					const key = String(item.id_api).trim();

					// Contar amigos que lo tienen
					try {
						const count =
							await this.userItemRepository.contarUsuariosConItem(
								item.id_api,
								item.tipo,
								user.id
							);
						item.numAmigos = count ?? 0;
					} catch (err) {
						console.error(
							` Error contando amigos para ${item.id_api}:`,
							err
						);
						item.numAmigos = 0;
					}

					// Verificar si el usuario ya lo tiene guardado
					const guardado = itemsMap.get(key);
					item.item = guardado
						? { id: guardado.id, estado: guardado.estado }
						: null;
				})
			);

			return resultados;
		} catch (error) {
			console.error(' Error general en búsqueda:', error);
			return [];
		}
	}
}
