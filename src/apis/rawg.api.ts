import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const RAWG_BASE_URL = 'https://api.rawg.io/api/games';
const RAWG_TOKEN = process.env.RAWG_TOKEN;

interface RawgGame {
	id: number;
	name?: string;
	background_image?: string;
	genres?: { name: string }[];
	platforms?: { platform: { name: string } }[]; // 🔹 Añadimos plataformas
}

interface RawgGameDetails extends RawgGame {
	description_raw?: string;
}

interface RawgResponse {
	results?: RawgGame[];
}

@Injectable()
export class RawgService {
	async buscar(query: string) {
		try {
			// 🔹 1️⃣ Primera llamada: Buscar juegos por nombre
			const response = await axios.get<RawgResponse>(RAWG_BASE_URL, {
				params: {
					key: RAWG_TOKEN,
					search: query,
					page_size: 5, // 🔹 Limitamos la búsqueda para eficiencia
				},
			});

			const juegos = response.data.results ?? [];

			// 🔹 2️⃣ Segunda llamada: Obtener descripción de cada juego
			const juegosConDescripcion = await Promise.all(
				juegos.map(async (juego) => {
					try {
						const detailsResponse =
							await axios.get<RawgGameDetails>(
								`${RAWG_BASE_URL}/${juego.id}`,
								{ params: { key: RAWG_TOKEN } }
							);
						return {
							id_api: juego.id,
							tipo: 'V',
							imagen: juego.background_image || null,
							titulo: juego.name || 'Sin título',
							descripcion:
								detailsResponse.data.description_raw ||
								'Sin descripción',
							genero: juego.genres?.map((g) => g.name) ?? [
								'Desconocido',
							],
							plataformas: juego.platforms?.map(
								(p) => p.platform.name
							) ?? ['Desconocido'], // 🔹 Incluimos siempre las plataformas
						};
					} catch (error) {
						console.error(
							`Error al obtener detalles del juego ${juego.id}:`,
							(error as Error).message
						);
						return {
							id_api: juego.id,
							tipo: 'V',
							imagen: juego.background_image || null,
							titulo: juego.name || 'Sin título',
							descripcion: 'Sin descripción',
							genero: juego.genres?.map((g) => g.name) ?? [
								'Desconocido',
							],
							plataformas: juego.platforms?.map(
								(p) => p.platform.name
							) ?? ['Desconocido'], // 🔹 Si falla, ponemos "Desconocido"
						};
					}
				})
			);

			return juegosConDescripcion;
		} catch (error) {
			console.error('Error en RAWG:', (error as Error).message);
			return [];
		}
	}
}
