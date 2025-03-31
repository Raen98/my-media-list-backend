import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_TOKEN = process.env.GOOGLE_TOKEN;
//Diccionario de traducción de géneros de Google Books
const GOOGLE_GENRES_TRANSLATIONS: Record<string, string> = {
	Fiction: 'Ficción',
	Nonfiction: 'No ficción',
	Science: 'Ciencia',
	'Biography & Autobiography': 'Biografía y autobiografía',
	History: 'Historia',
	Fantasy: 'Fantasía',
	Horror: 'Terror',
	Mystery: 'Misterio',
	Romance: 'Romance',
	'Science Fiction': 'Ciencia ficción',
	Thrillers: 'Thrillers',
	Poetry: 'Poesía',
	Drama: 'Drama',
	'Self-Help': 'Autoayuda',
	'Young Adult': 'Juvenil',
	Children: 'Infantil',
	'Science-Fiction': 'Ciencia ficción',
};

interface GoogleBookVolume {
	id: string;
	volumeInfo: {
		authors?: string[];
		pageCount: number;
		publishedDate: string;
		title?: string;
		description?: string;
		categories?: string[];
		imageLinks?: {
			thumbnail?: string;
		};
	};
}

interface GoogleBooksResponse {
	items?: GoogleBookVolume[];
}
@Injectable()
export class GoogleBooksService {
	async buscarPorId(id_api: string): Promise<{
		id_api: string;
		imagen: string | null;
		titulo: string;
		descripcion: string;
		genero: string[];
		autor: string;
		paginas: number | null;
		fechaLanzamiento: string;
	} | null> {
		try {
			const response = await axios.get<{ volumeInfo: any }>(
				`https://www.googleapis.com/books/v1/volumes/${id_api}`,
				{
					params: { key: GOOGLE_TOKEN },
				}
			);

			const item: GoogleBookVolume = response.data as GoogleBookVolume; // 👈 Se utiliza la interfaz GoogleBookVolume para tipar la estructura

			return {
				id_api: item.id,
				imagen: item.volumeInfo?.imageLinks?.thumbnail || null,
				titulo: item.volumeInfo?.title || 'Sin título',
				descripcion: item.volumeInfo?.description || 'Sin descripción',
				genero: item.volumeInfo?.categories ?? ['Desconocido'],
				autor: (item.volumeInfo?.authors || ['Desconocido']).join(', '),
				paginas: item.volumeInfo?.pageCount ?? null,
				fechaLanzamiento:
					item.volumeInfo?.publishedDate || 'Desconocido',
			};
		} catch (error) {
			console.error(
				'Error al buscar libro por ID:',
				(error as Error).message
			);
			return null;
		}
	}

	async buscar(query: string) {
		try {
			const response = await axios.get<GoogleBooksResponse>(
				GOOGLE_BOOKS_URL,
				{
					params: {
						q: query,
						key: GOOGLE_TOKEN,
						maxResults: 30,
						langRestrict: 'es',
					},
				}
			);

			return (
				response.data.items?.map((item: GoogleBookVolume) => ({
					id_api: item.id,
					tipo: 'L',
					imagen: item.volumeInfo.imageLinks?.thumbnail || null,
					titulo: item.volumeInfo.title || 'Sin título',
					fechaLanzamiento:
						item.volumeInfo.publishedDate || 'Desconocida',
					paginas: item.volumeInfo.pageCount || 0,
					autor: item.volumeInfo.authors?.join(', ') || 'Desconocido',
					descripcion:
						item.volumeInfo.description || 'Sin descripción',
					genero: (item.volumeInfo.categories ?? ['Desconocido']).map(
						(cat) => GOOGLE_GENRES_TRANSLATIONS[cat] || cat
					),
				})) ?? []
			);
		} catch (error) {
			console.error('Error en Google Books:', (error as Error).message);
			return [];
		}
	}
}
