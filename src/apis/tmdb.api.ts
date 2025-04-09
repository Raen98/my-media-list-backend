import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_TOKEN;

interface TmdbResult {
	first_air_date: string | null;
	release_date: string | null;
	id: string;
	poster_path?: string;
	title?: string;
	name?: string;
	overview?: string;
	genre_ids?: number[];
}

interface TmdbResponse {
	results: TmdbResult[];
}

@Injectable()
export class TmdbService implements OnModuleInit {
	private genresMovie: Record<number, string> = {};
	private genresTv: Record<number, string> = {};

	// Cargar los géneros al iniciar el módulo
	async onModuleInit() {
		await this.loadGenres();
	}

	// Este método obtiene los detalles completos de una película en TMDB
	// Incluye título, imagen, géneros, fecha, director y duración.
	// También accede a los créditos (append_to_response=credits) para extraer el director.

	async buscarPeliculaPorId(id_api: string) {
		try {
			const response = await axios.get<{
				id: number;
				poster_path?: string;
				title: string;
				overview?: string;
				genres?: { id: number; name: string }[];
				release_date?: string;
				credits?: {
					crew?: { job: string; name: string }[];
				};
				runtime?: number;
			}>(`${TMDB_BASE_URL}/movie/${id_api}`, {
				headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
				params: {
					language: 'es-ES',
					append_to_response: 'credits',
				},
			});

			const data: {
				id: number;
				poster_path?: string;
				title: string;
				overview?: string;
				genres?: { id: number; name: string }[];
				release_date?: string;
				credits?: {
					crew?: { job: string; name: string }[];
				};
				runtime?: number;
			} = response.data;

			const autor =
				data.credits?.crew?.find((person) => person.job === 'Director')
					?.name || 'Desconocido';

			return {
				id_api: data.id.toString(),
				imagen: data.poster_path
					? `https://image.tmdb.org/t/p/w500${data.poster_path}`
					: null,
				titulo: data.title,
				descripcion: data.overview || 'Sinopsis no disponible',
				genero: data.genres?.map((g) => g.name) ?? ['Desconocido'],
				fechaLanzamiento: data.release_date || 'Desconocido',
				autor: autor,
				duracion: data.runtime ?? 0,
			};
		} catch (error) {
			console.error('Error al buscar película en TMDB:', error);
			throw new Error('No se pudo obtener la película');
		}
	}

	async buscarSeriePorId({ id_api }: { id_api: string }) {
		try {
			const response = await axios.get(`${TMDB_BASE_URL}/tv/${id_api}`, {
				headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
				params: {
					language: 'es-ES',
				},
			});

			const data = response.data as {
				id: number;
				poster_path?: string;
				name?: string;
				overview?: string;
				genres?: { id: number; name: string }[];
				first_air_date?: string;
				number_of_seasons?: number;
				number_of_episodes?: number;
				created_by?: { name: string }[];
			};

			// Buscamos al primer creador
			const autor = data.created_by?.[0]?.name || 'Desconocido';

			return {
				id_api: data.id.toString(),
				imagen: data.poster_path
					? `https://image.tmdb.org/t/p/w500${data.poster_path}`
					: null,
				titulo: data.name || 'Sin título',
				descripcion: data.overview || 'Sinopsis no disponible',
				genero: data.genres?.map((g) => g.name) ?? ['Desconocido'],
				fechaLanzamiento: data.first_air_date || 'Desconocido',
				autor: autor,
				temporadas: data.number_of_seasons ?? 0,
				episodios: data.number_of_episodes ?? 0,
			};
		} catch (error) {
			console.error('Error al buscar serie en TMDB:', error);
			throw new Error('No se pudo obtener la serie');
		}
	}

	// Carga y almacena los géneros de películas y series en memoria
	private async loadGenres() {
		try {
			const [moviesRes, tvRes] = await Promise.all([
				axios.get<{ genres: { id: number; name: string }[] }>(
					`${TMDB_BASE_URL}/genre/movie/list?language=es-ES`,
					{ headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
				),
				axios.get<{ genres: { id: number; name: string }[] }>(
					`${TMDB_BASE_URL}/genre/tv/list?language=es-ES`,
					{ headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
				),
			]);

			this.genresMovie = Object.fromEntries(
				moviesRes.data.genres.map((g) => [g.id, g.name])
			);
			this.genresTv = Object.fromEntries(
				tvRes.data.genres.map((g) => [g.id, g.name])
			);
		} catch (error) {
			console.error(
				'Error al cargar los géneros de TMDB:',
				(error as Error).message
			);
		}
	}

	// Realiza la búsqueda en TMDB según el tipo (P = película, S = serie)
	async buscar(query: string, tipo: 'P' | 'S') {
		console.log('TmdbService.buscar() fue llamado con:', query, tipo);
		try {
			const endpoint = tipo === 'P' ? 'movie' : 'tv';
			const url = `${TMDB_BASE_URL}/search/${endpoint}`;

			const response = await axios.get<TmdbResponse>(url, {
				headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
				params: { query, language: 'es-ES', page: 1 },
			});

			return response.data.results.slice(0, 20).map((item) => ({
				id_api: item.id,
				tipo,
				imagen: item.poster_path
					? `https://image.tmdb.org/t/p/w500${item.poster_path}`
					: null,
				titulo: item.title || item.name || 'Sin título',
				descripcion: item.overview || 'Sin descripción',
				fechaLanzamiento:
					item.release_date || item.first_air_date || 'Desconocido',
				genero: (item.genre_ids ?? []).map((id) =>
					tipo === 'P'
						? this.genresMovie[id] || 'Desconocido'
						: this.genresTv[id] || 'Desconocido'
				),
			}));
		} catch (error) {
			console.error('Error en TMDB:', (error as Error).message);
			return [];
		}
	}
}
