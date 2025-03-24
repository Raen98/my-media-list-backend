import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_TOKEN;

// Interfaz para los resultados de TMDB
interface TmdbResult {
	id: number;
	poster_path?: string;
	title?: string;
	name?: string;
	overview?: string;
	genre_ids?: number[];
}

// Interfaz para la respuesta de TMDB
interface TmdbResponse {
	results: TmdbResult[];
}

@Injectable()
export class TmdbService implements OnModuleInit {
	private genresMovie: Record<number, string> = {};
	private genresTv: Record<number, string> = {};

	// 🔹 Cargar los géneros al iniciar el backend
	async onModuleInit() {
		await this.loadGenres();
	}

	// 🔹 Obtener la lista de géneros y guardarlos en memoria
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

			// Guardar los géneros en memoria como { id: "nombre" }
			this.genresMovie = Object.fromEntries(
				moviesRes.data.genres.map((g) => [g.id, g.name])
			);
			this.genresTv = Object.fromEntries(
				tvRes.data.genres.map((g) => [g.id, g.name])
			);

			console.log('Géneros de películas y series cargados en memoria.');
		} catch (error) {
			console.error(
				'Error al cargar los géneros de TMDB:',
				(error as Error).message
			);
		}
	}

	// 🔹 Método para buscar en TMDB y devolver los géneros con nombres
	async buscar(query: string, tipo: 'P' | 'S') {
		console.log('TmdbService.buscar() fue llamado con:', query, tipo);
		try {
			const endpoint = tipo === 'P' ? 'movie' : 'tv';
			const url = `${TMDB_BASE_URL}/search/${endpoint}`;

			const response = await axios.get<TmdbResponse>(url, {
				headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
				params: { query, language: 'es-ES', page: 1 },
			});

			console.log('Enviando token a TMDB:', `Bearer ${TMDB_TOKEN}`);
			console.log(
				'TMDB Response:',
				JSON.stringify(response.data, null, 2)
			);

			// 🔹 Convertir los IDs de género en nombres antes de devolver la respuesta
			return response.data.results.slice(0, 30).map((item) => ({
				id_api: item.id,
				tipo,
				imagen: item.poster_path
					? `https://image.tmdb.org/t/p/w500${item.poster_path}`
					: null,
				titulo: item.title || item.name || 'Sin título',
				descripcion: item.overview || 'Sin descripción',
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
