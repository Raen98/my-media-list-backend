import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3/search';
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
export class TmdbService {
	async buscar(query: string, tipo: 'P' | 'S') {
		console.log('TmdbService.buscar() fue llamado con:', query, tipo);
		try {
			const endpoint = tipo === 'P' ? 'movie' : 'tv';
			const url = `${TMDB_BASE_URL}/${endpoint}`;

			const response = await axios.get<TmdbResponse>(url, {
				headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
				params: { query, language: 'es-ES', page: 1 },
			});

			console.log('Enviando token a TMDB:', `Bearer ${TMDB_TOKEN}`);

			console.log(
				'TMDB Response:',
				JSON.stringify(response.data, null, 2)
			);

			return response.data.results.slice(0, 30).map((item) => ({
				id_api: item.id,
				tipo,
				imagen: item.poster_path
					? `https://image.tmdb.org/t/p/w500${item.poster_path}`
					: null,
				titulo: item.title || item.name || 'Sin título',
				descripcion: item.overview || 'Sin descripción',
				genero: item.genre_ids ?? [],
			}));
		} catch (error) {
			console.error('Error en TMDB:', (error as Error).message);
			return [];
		}
	}
}
