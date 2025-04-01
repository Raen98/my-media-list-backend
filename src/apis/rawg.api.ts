import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const RAWG_BASE_URL = 'https://api.rawg.io/api/games';
const RAWG_TOKEN = process.env.RAWG_TOKEN;
const WIKIPEDIA_API = 'https://es.wikipedia.org/api/rest_v1/page/summary/';

interface RawgGame {
	released: string;
	id: string;
	name?: string;
	background_image?: string;
	genres?: { name: string }[];
	platforms?: { platform: { name: string } }[];
	developers?: { name: string }[];
}

interface RawgResponse {
	results?: RawgGame[];
}

interface WikipediaResponse {
	title: string;
	extract?: string;
}

@Injectable()
export class RawgService {
	// Método para buscar videojuegos en RAWG
	async buscar(query: string) {
		try {
			//  Buscar juegos en RAWG
			const response = await axios.get<RawgResponse>(RAWG_BASE_URL, {
				params: {
					key: RAWG_TOKEN,
					search: query,
					page_size: 5,
				},
			});

			const juegos = response.data.results ?? [];

			//  Obtener descripción desde Wikipedia
			const juegosConDescripcion = await Promise.all(
				juegos.map(async (juego) => {
					const descripcion = await this.buscarDescripcionWikipedia(
						juego.name
					);

					return {
						id_api: juego.id,
						tipo: 'V',
						imagen: juego.background_image || null,
						titulo: juego.name || 'Sin título',
						descripcion: descripcion || 'Sin descripción',
						autor: juego.developers?.[0]?.name || 'Desconocido',
						fechaLanzamiento: juego.released || 'Desconocido',
						genero: juego.genres?.map((g) => g.name) ?? [
							'Desconocido',
						],
						plataformas: juego.platforms?.map(
							(p) => p.platform.name
						) ?? ['Desconocido'],
					};
				})
			);

			return juegosConDescripcion;
		} catch (error) {
			console.error('Error en RAWG:', (error as Error).message);
			return [];
		}
	}

	//Método para buscar la descripción en Wikipedia
	private async buscarDescripcionWikipedia(titulo?: string): Promise<string> {
		if (!titulo) return 'Sin descripción';

		try {
			const response = await axios.get<WikipediaResponse>(
				`${WIKIPEDIA_API}${encodeURIComponent(titulo)}`
			);

			if (response.data.extract) {
				return response.data.extract;
			}
		} catch (error) {
			console.error(
				`No se encontró descripción en Wikipedia para "${titulo}":`,
				(error as Error).message
			);
		}

		return 'Sin descripción';
	}

	/**
	 * Obtiene el detalle completo de un videojuego por su ID desde RAWG.
	 * Incluye descripción desde Wikipedia si está disponible.
	 *
	 * @param id_api ID del juego en RAWG
	 * @returns Objeto con los detalles del juego
	 */
	async buscarPorId(id_api: string) {
		try {
			const response = await axios.get<RawgGame>(
				`${RAWG_BASE_URL}/${id_api}`,
				{
					params: {
						key: RAWG_TOKEN,
					},
				}
			);

			const juego = response.data;

			// Intentamos obtener una descripción extendida desde Wikipedia
			const descripcion = await this.buscarDescripcionWikipedia(
				juego.name
			);

			return {
				id_api: juego.id?.toString(),
				imagen: juego.background_image || null,
				titulo: juego.name || 'Sin título',
				descripcion: descripcion || 'Sin descripción',
				genero: juego.genres?.map((g) => g.name) ?? ['Desconocido'],
				año: juego.released
					? new Date(juego.released).getFullYear()
					: null,
				desarrolladora: juego.developers?.[0]?.name || 'Desconocida',
				plataforma: juego.platforms?.map((p) => p.platform.name) ?? [
					'Desconocido',
				],
			};
		} catch (error) {
			console.error(
				'Error al obtener juego por ID en RAWG:',
				(error as Error).message
			);
			throw new Error('No se pudo obtener el detalle del videojuego');
		}
	}
}
